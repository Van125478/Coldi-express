import { canonicalPositiveDecimal, isIsoDate, redactSecrets } from "./decimal.js";
import { EIA_DATA_ROUTE, OIL_ACCEPTED_UNITS } from "./policy.js";

export type ParsedOilRow = {
  seriesId: string;
  observedDate: string;
  priceUsdPerBarrel: string;
  unitsRaw: string;
};

export type RejectedOilRow = {
  code: "INVALID_PRICE" | "INVALID_UNIT" | "INVALID_DATE" | "SCHEMA";
  period: string | null;
};

export type EiaParseResult =
  | { ok: true; rows: ParsedOilRow[]; rejected: RejectedOilRow[] }
  | { ok: false; code: "SCHEMA" | "CREDENTIALS" | "MALFORMED" };

export type EiaFetchFailure = "HTTP_429" | "HTTP_UPSTREAM" | "TIMEOUT" | "NETWORK" | "CREDENTIALS" | "MALFORMED" | "SCHEMA" | "MISSING";

export type EiaFetchResult = EiaParseResult | { ok: false; code: EiaFetchFailure };

type FetchLike = (input: string, init?: { signal?: AbortSignal }) => Promise<Response>;

function isCrudeBarrelProduct(productName: string, seriesId: string): boolean {
  if (/barrel/i.test(productName)) return true;
  if (!/crude oil/i.test(productName)) return false;
  if (seriesId === "RBRTE") return /brent/i.test(productName);
  if (seriesId === "RWTC") return /\bwti\b/i.test(productName);
  return false;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function buildEiaDataUrl(seriesId: string, apiKey: string): string {
  const url = new URL(EIA_DATA_ROUTE);
  url.searchParams.set("api_key", apiKey);
  url.searchParams.set("frequency", "daily");
  url.searchParams.append("data[]", "value");
  url.searchParams.append("facets[series][]", seriesId);
  url.searchParams.append("sort[0][column]", "period");
  url.searchParams.append("sort[0][direction]", "desc");
  url.searchParams.set("offset", "0");
  url.searchParams.set("length", "5");
  return url.toString();
}

function credentialCode(error: Record<string, unknown>): boolean {
  return error.code === "API_KEY_MISSING" || error.code === "API_KEY_INVALID";
}

function parseRow(item: unknown, seriesId: string): { kind: "skip" } | { kind: "row"; row: ParsedOilRow } | { kind: "rejected"; rejected: RejectedOilRow } {
  if (!isRecord(item)) return { kind: "rejected", rejected: { code: "SCHEMA", period: null } };
  if (item.series !== seriesId) return { kind: "skip" };
  const period = typeof item.period === "string" ? item.period : null;
  if (period === null || !isIsoDate(period)) return { kind: "rejected", rejected: { code: "INVALID_DATE", period } };
  if (typeof item.value !== "string") return { kind: "rejected", rejected: { code: "SCHEMA", period } };
  if (item.units !== OIL_ACCEPTED_UNITS) return { kind: "rejected", rejected: { code: "INVALID_UNIT", period } };
  const productName = item["product-name"];
  if (typeof productName === "string" && !isCrudeBarrelProduct(productName, seriesId)) {
    return { kind: "rejected", rejected: { code: "INVALID_UNIT", period } };
  }
  const price = canonicalPositiveDecimal(item.value);
  if (price === null) return { kind: "rejected", rejected: { code: "INVALID_PRICE", period } };
  return {
    kind: "row",
    row: { seriesId, observedDate: period, priceUsdPerBarrel: price, unitsRaw: OIL_ACCEPTED_UNITS },
  };
}

export function parseEiaPayload(body: unknown, seriesId: string): EiaParseResult {
  if (!isRecord(body)) return { ok: false, code: "SCHEMA" };
  if (isRecord(body.error)) return { ok: false, code: credentialCode(body.error) ? "CREDENTIALS" : "SCHEMA" };
  const response = body.response;
  if (!isRecord(response) || response.frequency !== "daily" || !Array.isArray(response.data)) {
    return { ok: false, code: "SCHEMA" };
  }
  const rows: ParsedOilRow[] = [];
  const rejected: RejectedOilRow[] = [];
  for (const item of response.data) {
    const outcome = parseRow(item, seriesId);
    if (outcome.kind === "row") rows.push(outcome.row);
    if (outcome.kind === "rejected") rejected.push(outcome.rejected);
  }
  rows.sort((left, right) => left.observedDate.localeCompare(right.observedDate));
  return { ok: true, rows, rejected };
}

function isTimeout(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  return error.name === "TimeoutError" || error.name === "AbortError";
}

function sleep(ms: number): Promise<void> {
  if (ms <= 0) return Promise.resolve();
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

export async function fetchEiaSeries(input: {
  seriesId: string;
  apiKey: string;
  fetchImpl?: FetchLike | undefined;
  timeoutMs?: number | undefined;
  retryDelaysMs?: number[] | undefined;
}): Promise<EiaFetchResult> {
  if (input.apiKey.trim() === "") return { ok: false, code: "CREDENTIALS" };
  const fetchImpl = input.fetchImpl ?? fetch;
  const timeoutMs = input.timeoutMs ?? 8_000;
  const delays = input.retryDelaysMs ?? [500, 1_500];
  const attempts = delays.length + 1;
  const url = buildEiaDataUrl(input.seriesId, input.apiKey);
  let lastCode: EiaFetchFailure = "NETWORK";

  for (let attempt = 0; attempt < attempts; attempt += 1) {
    try {
      const response = await fetchImpl(url, { signal: AbortSignal.timeout(timeoutMs) });
      const text = await response.text();
      if (response.status === 429) {
        lastCode = "HTTP_429";
        if (attempt < attempts - 1) {
          await sleep(retryAfterMs(response) ?? delays[attempt] ?? 0);
          continue;
        }
        return { ok: false, code: "HTTP_429" };
      }
      if (response.status >= 500) {
        lastCode = "HTTP_UPSTREAM";
        if (attempt < attempts - 1) {
          await sleep(delays[attempt] ?? 0);
          continue;
        }
        return { ok: false, code: "HTTP_UPSTREAM" };
      }
      let body: unknown;
      try {
        body = JSON.parse(text) as unknown;
      } catch {
        return { ok: false, code: "MALFORMED" };
      }
      if (response.status === 401 || response.status === 403) return { ok: false, code: "CREDENTIALS" };
      const parsed = parseEiaPayload(body, input.seriesId);
      if (!parsed.ok) return parsed;
      if (!response.ok) return { ok: false, code: "HTTP_UPSTREAM" };
      return parsed;
    } catch (error) {
      lastCode = isTimeout(error) ? "TIMEOUT" : "NETWORK";
      if (attempt < attempts - 1) {
        await sleep(delays[attempt] ?? 0);
        continue;
      }
      return { ok: false, code: lastCode };
    }
  }

  return { ok: false, code: lastCode };
}

function retryAfterMs(response: Response): number | null {
  const header = response.headers.get("retry-after");
  if (header === null) return null;
  const seconds = Number(header);
  if (!Number.isFinite(seconds) || seconds < 0 || seconds > 5) return null;
  return Math.round(seconds * 1000);
}

export function safeUpstreamMessage(error: unknown, secrets: readonly string[]): string {
  const message = error instanceof Error ? error.message : "Upstream request failed.";
  return redactSecrets(message, secrets);
}
