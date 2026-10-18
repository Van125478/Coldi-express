import mongoose from "mongoose";
import { canonicalPositiveDecimal } from "./decimal.js";
import { evaluateFreshness, type VerifiedReleaseCalendar } from "./freshness.js";
import {
  OIL_CURRENCY,
  OIL_DISCLAIMER,
  OIL_FREQUENCY,
  OIL_PROVIDER,
  OIL_SERIES,
  OIL_UNIT,
  type FreshnessStatus,
  type OilBenchmark,
  type SyncStatus,
} from "./policy.js";
import { OilPriceObservation, OilPriceSyncState, OilSourceSchedule } from "../../models/oilPrice.js";

export type OilBenchmarkPayload = {
  benchmark: OilBenchmark;
  seriesId: string;
  label: string;
  priceUsdPerBarrel: string | null;
  currency: typeof OIL_CURRENCY;
  unit: typeof OIL_UNIT;
  observedDate: string | null;
  fetchedAt: string | null;
  publishedAt: null;
  provider: typeof OIL_PROVIDER | null;
  sourceUrl: string;
  freshnessStatus: FreshnessStatus;
  freshnessLabel: string;
  syncStatus: SyncStatus;
  warning: string | null;
};

export type OilPricesPayload = {
  disclaimer: string;
  currency: typeof OIL_CURRENCY;
  unit: typeof OIL_UNIT;
  benchmarks: OilBenchmarkPayload[];
};

const freshnessLabels: Record<FreshnessStatus, string> = {
  FRESH: "Mới nhất đã công bố",
  STALE: "Dữ liệu có thể đã cũ",
  UNKNOWN: "Chưa xác định độ mới",
  UNAVAILABLE: "Chưa tải được giá dầu thế giới",
};

function warningFor(freshness: FreshnessStatus, syncStatus: SyncStatus, hasPrice: boolean): string | null {
  if (!hasPrice) return "Chưa tải được giá dầu thế giới.";
  if (syncStatus === "ERROR") return "Nguồn đồng bộ đang gián đoạn. Đang hiển thị giá hợp lệ đã lưu.";
  if (freshness === "STALE") return "Dữ liệu có thể đã cũ.";
  if (freshness === "UNKNOWN") return "Chưa xác định độ mới vì chưa có lịch công bố đã kiểm chứng.";
  return null;
}

function benchmarkPayload(
  series: (typeof OIL_SERIES)[number],
  price: string | null,
  observedDate: string | null,
  fetchedAt: string | null,
  freshness: FreshnessStatus,
  syncStatus: SyncStatus,
): OilBenchmarkPayload {
  const hasPrice = price !== null;
  return {
    benchmark: series.benchmark,
    seriesId: series.seriesId,
    label: series.label,
    priceUsdPerBarrel: price,
    currency: OIL_CURRENCY,
    unit: OIL_UNIT,
    observedDate: hasPrice ? observedDate : null,
    fetchedAt: hasPrice ? fetchedAt : null,
    publishedAt: null,
    provider: hasPrice ? OIL_PROVIDER : null,
    sourceUrl: series.sourceUrl,
    freshnessStatus: freshness,
    freshnessLabel: freshnessLabels[freshness],
    syncStatus,
    warning: warningFor(freshness, syncStatus, hasPrice),
  };
}

export function unavailableOilPrices(): OilPricesPayload {
  return {
    disclaimer: OIL_DISCLAIMER,
    currency: OIL_CURRENCY,
    unit: OIL_UNIT,
    benchmarks: OIL_SERIES.map((series) => benchmarkPayload(series, null, null, null, "UNAVAILABLE", "ERROR")),
  };
}

function calendarFrom(record: {
  verified: boolean;
  expectedWeekdays: number[];
  excludedDates: string[];
  deadlineOffsetDays: number;
  deadlineMinutesUtc: number;
} | null): VerifiedReleaseCalendar | null {
  if (record === null || record.verified !== true) return null;
  return {
    verified: true,
    expectedWeekdays: record.expectedWeekdays,
    excludedDates: record.excludedDates,
    deadlineOffsetDays: record.deadlineOffsetDays,
    deadlineMinutesUtc: record.deadlineMinutesUtc,
  };
}

export async function readOilPrices(now = new Date()): Promise<OilPricesPayload> {
  if (mongoose.connection.readyState !== 1) return unavailableOilPrices();

  const benchmarks: OilBenchmarkPayload[] = [];
  for (const series of OIL_SERIES) {
    const [observation, syncState, schedule] = await Promise.all([
      OilPriceObservation.findOne({
        provider: OIL_PROVIDER,
        seriesId: series.seriesId,
        frequency: OIL_FREQUENCY,
        superseded: false,
      }).sort({ observedDate: -1, revision: -1 }),
      OilPriceSyncState.findOne({ provider: OIL_PROVIDER, seriesId: series.seriesId }),
      OilSourceSchedule.findOne({ provider: OIL_PROVIDER, seriesId: series.seriesId, verified: true }),
    ]);
    const price = observation ? canonicalPositiveDecimal(observation.priceUsdPerBarrel) : null;
    const observedDate = observation?.observedDate ?? null;
    const hasPrice = price !== null && observedDate !== null;
    const syncStatus: SyncStatus = syncState?.status ?? "NOT_ATTEMPTED";
    const freshness = evaluateFreshness({
      hasObservation: hasPrice,
      observedDate: hasPrice ? observedDate : null,
      calendar: calendarFrom(schedule),
      now,
    });
    benchmarks.push(
      benchmarkPayload(series, hasPrice ? price : null, observedDate, observation ? observation.fetchedAt.toISOString() : null, freshness, syncStatus),
    );
  }

  return {
    disclaimer: OIL_DISCLAIMER,
    currency: OIL_CURRENCY,
    unit: OIL_UNIT,
    benchmarks,
  };
}
