import { HttpError } from "../middlewares/errorHandler.js";
import { temperatureGroups, type TemperatureGroup } from "../models/shipment.js";
import { marketplaceFilter, type MarketplaceQuery } from "../shipments/marketplaceQuery.js";

const allowedKeys = ["q", "temperature", "sort"] as const;
const sorts = ["priceDesc", "price", "newest"] as const;

export type MobileCatalogSort = (typeof sorts)[number];

export type MobileCatalogQuery = {
  q?: string;
  temperature?: TemperatureGroup;
  sort: MobileCatalogSort;
};

function readText(query: Record<string, unknown>, key: string, limit: number): string | undefined {
  const value = query[key];
  if (value === undefined) return undefined;
  if (typeof value !== "string") throw new HttpError(400, "invalid_request", "Bộ lọc chứa tham số không hợp lệ.");
  const trimmed = value.trim();
  if (trimmed.length === 0) return undefined;
  if (trimmed.length > limit) throw new HttpError(400, "invalid_request", "Từ khóa lọc quá dài.");
  return trimmed;
}

export function readMobileCatalogQuery(query: Record<string, unknown>): MobileCatalogQuery {
  for (const key of Object.keys(query)) {
    if (!allowedKeys.includes(key as (typeof allowedKeys)[number])) {
      throw new HttpError(400, "invalid_request", "Bộ lọc chứa tham số không được phép.");
    }
  }

  const temperature = readText(query, "temperature", 20);
  if (temperature !== undefined && !temperatureGroups.includes(temperature as TemperatureGroup)) {
    throw new HttpError(400, "invalid_request", "Nhóm nhiệt độ không hợp lệ.");
  }

  const sortValue = readText(query, "sort", 20) ?? "priceDesc";
  if (!sorts.includes(sortValue as MobileCatalogSort)) {
    throw new HttpError(400, "invalid_request", "Cách sắp xếp không hợp lệ.");
  }

  const q = readText(query, "q", 80);
  const parsed: MobileCatalogQuery = { sort: sortValue as MobileCatalogSort };
  if (q !== undefined) parsed.q = q;
  if (temperature !== undefined) parsed.temperature = temperature as TemperatureGroup;
  return parsed;
}

export function carrierBoardFilter(input: MobileCatalogQuery) {
  const market: MarketplaceQuery = { sort: "newest" };
  if (input.q !== undefined) market.q = input.q;
  if (input.temperature !== undefined) market.temperature = input.temperature;
  return marketplaceFilter(market);
}

function escapePattern(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function shipperCatalogFilter(shipperId: string, input: MobileCatalogQuery) {
  const filter: {
    shipperId: string;
    temperatureGroup?: TemperatureGroup;
    $and?: object[];
  } = { shipperId };
  if (input.temperature) filter.temperatureGroup = input.temperature;
  if (input.q) {
    const pattern = new RegExp(escapePattern(input.q), "i");
    filter.$and = [{ $or: [{ cargoDescription: pattern }, { pickupLocation: pattern }, { deliveryLocation: pattern }] }];
  }
  return filter;
}

type Priced = { _id: { toString(): string }; createdAt?: Date; listedPriceVnd: number };

export function compareMobileShipments(sort: MobileCatalogSort) {
  return (left: Priced, right: Priced) => {
    const idOrder = left._id.toString().localeCompare(right._id.toString());
    if (sort === "newest") {
      const time = (right.createdAt?.getTime() ?? 0) - (left.createdAt?.getTime() ?? 0);
      return time !== 0 ? time : -idOrder;
    }
    const price = sort === "priceDesc" ? right.listedPriceVnd - left.listedPriceVnd : left.listedPriceVnd - right.listedPriceVnd;
    return price !== 0 ? price : idOrder;
  };
}
