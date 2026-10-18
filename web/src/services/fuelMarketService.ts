import { apiRequest } from "@/services/apiClient";
import type { OilPricesResponse } from "@/services/oilPriceService";

export type DieselView = {
  available: boolean;
  product: "DIESEL_005S";
  productLabel: string;
  priceVndPerLitre: number | null;
  priceKind: "OFFICIAL_CEILING" | "RETAIL" | null;
  priceKindLabel: string | null;
  unit: "VND/lít";
  documentNumber: string | null;
  sourceUrl: string | null;
  announcedOn: string | null;
  effectiveAt: string | null;
  verifiedAt: string | null;
  message: string | null;
  officialIndexUrl: string;
  latestKnownDocument: {
    number: string;
    announcedOn: string;
    sourceUrl: string;
    note: string;
  };
  disclaimer: string;
};

export type FuelMarketResponse = {
  diesel: DieselView;
  oil: OilPricesResponse;
};

export function getFuelMarket(): Promise<FuelMarketResponse> {
  return apiRequest<FuelMarketResponse>("/api/market/fuel");
}

export function formatVietnamWhen(value: string | null): string {
  if (!value) return "Chưa có";
  const date = new Date(value.length === 10 ? `${value}T00:00:00.000Z` : value);
  if (Number.isNaN(date.getTime())) return "Chưa có";
  const parts = new Intl.DateTimeFormat("vi-VN", {
    timeZone: "Asia/Ho_Chi_Minh",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: value.length === 10 ? undefined : "2-digit",
    minute: value.length === 10 ? undefined : "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const read = (type: Intl.DateTimeFormatPartTypes) => parts.find((part) => part.type === type)?.value ?? "";
  const day = `${read("day")}/${read("month")}/${read("year")}`;
  if (value.length === 10) return day;
  return `${read("hour")}:${read("minute")}, ${day}`;
}

export function formatVndPerLitre(value: number | null): string {
  if (value === null) return "—";
  return `${new Intl.NumberFormat("vi-VN").format(value)} ${"đồng/lít"}`;
}
