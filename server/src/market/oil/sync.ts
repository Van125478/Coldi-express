import { randomUUID } from "node:crypto";
import { fetchEiaSeries, safeUpstreamMessage, type EiaFetchResult, type ParsedOilRow, type RejectedOilRow } from "./eia.js";
import { redactSecrets } from "./decimal.js";
import {
  OIL_CURRENCY,
  OIL_FREQUENCY,
  OIL_PROVIDER,
  OIL_SCHEMA_VERSION,
  OIL_SERIES,
  OIL_SYNC_LOCK_ID,
  OIL_UNIT,
  type OilBenchmark,
} from "./policy.js";
import { OilPriceObservation, OilPriceSyncState, OilSyncLock } from "../../models/oilPrice.js";

type FetchLike = (input: string, init?: { signal?: AbortSignal }) => Promise<Response>;

export type SyncBenchmarkResult = {
  benchmark: OilBenchmark;
  seriesId: string;
  status: "OK" | "ERROR";
  code: string | null;
};

export type SyncReport = {
  skipped: boolean;
  benchmarks: SyncBenchmarkResult[];
};

export type SyncOilPricesInput = {
  apiKey: string;
  now?: Date;
  owner?: string;
  fetchImpl?: FetchLike;
  timeoutMs?: number;
  retryDelaysMs?: number[];
};

function duplicateKey(error: unknown): boolean {
  return typeof error === "object" && error !== null && "code" in error && (error as { code: unknown }).code === 11000;
}

async function acquireLock(owner: string, now: Date): Promise<boolean> {
  const expiresAt = new Date(now.getTime() + 120_000);
  const current = await OilSyncLock.findById(OIL_SYNC_LOCK_ID);
  if (current && current.expiresAt.getTime() > now.getTime() && current.owner !== owner) return false;
  if (!current) {
    try {
      await OilSyncLock.create({ _id: OIL_SYNC_LOCK_ID, owner, expiresAt });
      return true;
    } catch (error) {
      if (duplicateKey(error)) return false;
      throw error;
    }
  }
  const updated = await OilSyncLock.findOneAndUpdate(
    { _id: OIL_SYNC_LOCK_ID, owner: current.owner, expiresAt: current.expiresAt },
    { $set: { owner, expiresAt } },
    { new: true },
  );
  return updated?.owner === owner;
}

async function releaseLock(owner: string): Promise<void> {
  await OilSyncLock.deleteOne({ _id: OIL_SYNC_LOCK_ID, owner });
}

async function upsertObservation(row: ParsedOilRow, series: (typeof OIL_SERIES)[number], fetchedAt: Date): Promise<void> {
  const latest = await OilPriceObservation.findOne({
    provider: OIL_PROVIDER,
    seriesId: series.seriesId,
    frequency: OIL_FREQUENCY,
    observedDate: row.observedDate,
  }).sort({ revision: -1 });

  if (latest && latest.priceUsdPerBarrel === row.priceUsdPerBarrel) {
    await OilPriceObservation.updateMany(
      { provider: OIL_PROVIDER, seriesId: series.seriesId, frequency: OIL_FREQUENCY, observedDate: row.observedDate, _id: { $ne: latest._id } },
      { $set: { superseded: true } },
    );
    await OilPriceObservation.updateOne({ _id: latest._id }, { $set: { fetchedAt, superseded: false } });
    return;
  }

  const revision = latest ? latest.revision + 1 : 1;
  await OilPriceObservation.updateMany(
    { provider: OIL_PROVIDER, seriesId: series.seriesId, frequency: OIL_FREQUENCY, observedDate: row.observedDate },
    { $set: { superseded: true } },
  );
  await OilPriceObservation.create({
    provider: OIL_PROVIDER,
    seriesId: series.seriesId,
    benchmark: series.benchmark,
    frequency: OIL_FREQUENCY,
    observedDate: row.observedDate,
    priceUsdPerBarrel: row.priceUsdPerBarrel,
    unit: OIL_UNIT,
    currency: OIL_CURRENCY,
    sourceUrl: series.sourceUrl,
    fetchedAt,
    publishedAt: null,
    revision,
    superseded: false,
    validation: { unitsRaw: row.unitsRaw, schemaVersion: OIL_SCHEMA_VERSION },
  });
}

function newerRejection(rows: ParsedOilRow[], rejected: RejectedOilRow[]): boolean {
  const acceptedMax = rows.reduce((max, row) => (row.observedDate > max ? row.observedDate : max), "");
  return rejected.some((item) => item.period !== null && item.period >= acceptedMax);
}

async function recordSyncState(input: {
  series: (typeof OIL_SERIES)[number];
  status: "OK" | "ERROR";
  attemptedAt: Date;
  code: string | null;
  message: string | null;
}): Promise<void> {
  await OilPriceSyncState.findOneAndUpdate(
    { provider: OIL_PROVIDER, seriesId: input.series.seriesId },
    {
      $set: {
        benchmark: input.series.benchmark,
        status: input.status,
        lastAttemptedAt: input.attemptedAt,
        lastErrorCode: input.status === "OK" ? null : input.code,
        lastErrorMessage: input.status === "OK" ? null : input.message,
        ...(input.status === "OK" ? { lastSuccessfulAt: input.attemptedAt } : {}),
      },
    },
    { upsert: true },
  );
}

async function syncSeries(input: {
  series: (typeof OIL_SERIES)[number];
  apiKey: string;
  fetchedAt: Date;
  fetchImpl?: FetchLike | undefined;
  timeoutMs?: number | undefined;
  retryDelaysMs?: number[] | undefined;
}): Promise<SyncBenchmarkResult> {
  let result: EiaFetchResult;
  try {
    result = await fetchEiaSeries({
      seriesId: input.series.seriesId,
      apiKey: input.apiKey,
      fetchImpl: input.fetchImpl,
      timeoutMs: input.timeoutMs,
      retryDelaysMs: input.retryDelaysMs,
    });
  } catch (error) {
    const message = safeUpstreamMessage(error, [input.apiKey]);
    await recordSyncState({ series: input.series, status: "ERROR", attemptedAt: input.fetchedAt, code: "NETWORK", message });
    return { benchmark: input.series.benchmark, seriesId: input.series.seriesId, status: "ERROR", code: "NETWORK" };
  }

  if (!result.ok) {
    const message = redactSecrets(result.code, [input.apiKey]);
    await recordSyncState({ series: input.series, status: "ERROR", attemptedAt: input.fetchedAt, code: result.code, message });
    return { benchmark: input.series.benchmark, seriesId: input.series.seriesId, status: "ERROR", code: result.code };
  }

  if (result.rows.length === 0 && result.rejected.length === 0) {
    await recordSyncState({ series: input.series, status: "ERROR", attemptedAt: input.fetchedAt, code: "MISSING", message: "MISSING" });
    return { benchmark: input.series.benchmark, seriesId: input.series.seriesId, status: "ERROR", code: "MISSING" };
  }

  for (const row of result.rows) {
    await upsertObservation(row, input.series, input.fetchedAt);
  }

  if (result.rows.length === 0 || newerRejection(result.rows, result.rejected)) {
    const code = result.rejected[0]?.code ?? "SCHEMA";
    await recordSyncState({ series: input.series, status: "ERROR", attemptedAt: input.fetchedAt, code, message: code });
    return { benchmark: input.series.benchmark, seriesId: input.series.seriesId, status: "ERROR", code };
  }

  await recordSyncState({ series: input.series, status: "OK", attemptedAt: input.fetchedAt, code: null, message: null });
  return { benchmark: input.series.benchmark, seriesId: input.series.seriesId, status: "OK", code: null };
}

export async function syncOilPrices(input: SyncOilPricesInput): Promise<SyncReport> {
  const now = input.now ?? new Date();
  const owner = input.owner ?? randomUUID();
  if (input.apiKey.trim() === "") {
    const benchmarks: SyncBenchmarkResult[] = [];
    for (const series of OIL_SERIES) {
      await recordSyncState({ series, status: "ERROR", attemptedAt: now, code: "CREDENTIALS", message: "EIA API key is not configured." });
      benchmarks.push({ benchmark: series.benchmark, seriesId: series.seriesId, status: "ERROR", code: "CREDENTIALS" });
    }
    return { skipped: false, benchmarks };
  }

  const locked = await acquireLock(owner, now);
  if (!locked) return { skipped: true, benchmarks: [] };

  try {
    const benchmarks: SyncBenchmarkResult[] = [];
    for (const series of OIL_SERIES) {
      benchmarks.push(
        await syncSeries({
          series,
          apiKey: input.apiKey,
          fetchedAt: now,
          fetchImpl: input.fetchImpl,
          timeoutMs: input.timeoutMs,
          retryDelaysMs: input.retryDelaysMs,
        }),
      );
    }
    return { skipped: false, benchmarks };
  } finally {
    await releaseLock(owner);
  }
}
