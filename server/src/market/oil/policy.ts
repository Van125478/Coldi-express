export const OIL_PROVIDER = "EIA" as const;

export const OIL_FREQUENCY = "daily" as const;

export const OIL_CURRENCY = "USD" as const;

export const OIL_UNIT = "barrel" as const;

export const OIL_ACCEPTED_UNITS = "$/BBL" as const;

export const OIL_SCHEMA_VERSION = "eia-v2-spot-1" as const;

export const EIA_DATA_ROUTE = "https://api.eia.gov/v2/petroleum/pri/spt/data/" as const;

export const OIL_DISCLAIMER =
  "Giá dầu thô thế giới tham khảo, tính bằng USD/thùng. Không phải báo giá cước, không phải giá dầu diesel hoặc xăng bán lẻ tại Việt Nam, và không phải giá thời gian thực.";

export const freshnessStatuses = ["FRESH", "STALE", "UNKNOWN", "UNAVAILABLE"] as const;

export type FreshnessStatus = (typeof freshnessStatuses)[number];

export const syncStatuses = ["OK", "ERROR", "NOT_ATTEMPTED"] as const;

export type SyncStatus = (typeof syncStatuses)[number];

export const oilBenchmarks = ["BRENT", "WTI"] as const;

export type OilBenchmark = (typeof oilBenchmarks)[number];

export type OilSeries = {
  benchmark: OilBenchmark;
  seriesId: "RBRTE" | "RWTC";
  label: "Brent" | "WTI";
  sourceUrl: string;
};

export const OIL_SERIES: readonly OilSeries[] = [
  {
    benchmark: "BRENT",
    seriesId: "RBRTE",
    label: "Brent",
    sourceUrl: "https://www.eia.gov/dnav/pet/hist/LeafHandler.ashx?n=PET&s=RBRTE&f=D",
  },
  {
    benchmark: "WTI",
    seriesId: "RWTC",
    label: "WTI",
    sourceUrl: "https://www.eia.gov/dnav/pet/hist/LeafHandler.ashx?n=PET&s=RWTC&f=D",
  },
];

export function seriesById(seriesId: string): OilSeries | undefined {
  return OIL_SERIES.find((series) => series.seriesId === seriesId);
}

export const OIL_SYNC_LOCK_ID = "eia-oil-sync";
