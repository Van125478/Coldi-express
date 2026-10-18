import { apiRequest } from "@/services/apiClient";

export type OilFreshness = "FRESH" | "STALE" | "UNKNOWN" | "UNAVAILABLE";
export type OilSyncStatus = "OK" | "ERROR" | "NOT_ATTEMPTED";

export type OilBenchmarkView = {
  benchmark: "BRENT" | "WTI";
  seriesId: string;
  label: string;
  priceUsdPerBarrel: string | null;
  currency: "USD";
  unit: "barrel";
  observedDate: string | null;
  fetchedAt: string | null;
  publishedAt: string | null;
  provider: string | null;
  sourceUrl: string;
  freshnessStatus: OilFreshness;
  freshnessLabel: string;
  syncStatus: OilSyncStatus;
  warning: string | null;
};

export type OilPricesResponse = {
  disclaimer: string;
  currency: "USD";
  unit: "barrel";
  benchmarks: OilBenchmarkView[];
};

export function getOilPrices(): Promise<OilPricesResponse> {
  return apiRequest<OilPricesResponse>("/api/market/oil-prices");
}
