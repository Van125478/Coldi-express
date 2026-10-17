import { HttpError } from "../middlewares/errorHandler.js";
import { temperatureGroups, type TemperatureGroup } from "../models/shipment.js";

const allowedKeys = ["q", "temperature", "pickup", "delivery", "weightMin", "weightMax", "pickupFrom", "pickupTo", "sort"] as const;
const sorts = ["newest", "oldest", "pickup", "price", "weight"] as const;

export type MarketplaceSort = (typeof sorts)[number];

export type MarketplaceQuery = {
  q?: string;
  temperature?: TemperatureGroup;
  pickup?: string;
  delivery?: string;
  weightMin?: number;
  weightMax?: number;
  pickupFrom?: string;
  pickupTo?: string;
  sort: MarketplaceSort;
};

const datePattern = /^\d{4}-\d{2}-\d{2}$/;

function readText(query: Record<string, unknown>, key: string, limit: number): string | undefined {
  const value = query[key];
  if (value === undefined) return undefined;
  if (typeof value !== "string") throw new HttpError(400, "invalid_request", "Bộ lọc chứa tham số không hợp lệ.");
  const trimmed = value.trim();
  if (trimmed.length === 0) return undefined;
  if (trimmed.length > limit) throw new HttpError(400, "invalid_request", "Từ khóa lọc quá dài.");
  return trimmed;
}

function readWeight(query: Record<string, unknown>, key: string): number | undefined {
  const value = query[key];
  if (value === undefined || value === "") return undefined;
  if (typeof value !== "string" || !/^\d+(\.\d{1,3})?$/.test(value)) {
    throw new HttpError(400, "invalid_request", "Khoảng tải trọng không hợp lệ.");
  }
  const number = Number(value);
  if (!Number.isFinite(number) || number <= 0 || number > 100_000) {
    throw new HttpError(400, "invalid_request", "Khoảng tải trọng không hợp lệ.");
  }
  return number;
}

function readDate(query: Record<string, unknown>, key: string): string | undefined {
  const value = query[key];
  if (value === undefined || value === "") return undefined;
  if (typeof value !== "string" || !datePattern.test(value) || Number.isNaN(Date.parse(`${value}T00:00:00Z`))) {
    throw new HttpError(400, "invalid_request", "Khoảng ngày lấy hàng không hợp lệ.");
  }
  return value;
}

export function readMarketplaceQuery(query: Record<string, unknown>): MarketplaceQuery {
  for (const key of Object.keys(query)) {
    if (!allowedKeys.includes(key as (typeof allowedKeys)[number])) {
      throw new HttpError(400, "invalid_request", "Bộ lọc chứa tham số không được phép.");
    }
  }

  const temperature = readText(query, "temperature", 20);
  if (temperature !== undefined && !temperatureGroups.includes(temperature as TemperatureGroup)) {
    throw new HttpError(400, "invalid_request", "Nhóm nhiệt độ không hợp lệ.");
  }

  const sortValue = readText(query, "sort", 20) ?? "oldest";
  if (!sorts.includes(sortValue as MarketplaceSort)) {
    throw new HttpError(400, "invalid_request", "Cách sắp xếp không hợp lệ.");
  }

  const weightMin = readWeight(query, "weightMin");
  const weightMax = readWeight(query, "weightMax");
  if (weightMin !== undefined && weightMax !== undefined && weightMin > weightMax) {
    throw new HttpError(400, "invalid_request", "Khoảng tải trọng không hợp lệ.");
  }

  const pickupFrom = readDate(query, "pickupFrom");
  const pickupTo = readDate(query, "pickupTo");
  if (pickupFrom !== undefined && pickupTo !== undefined && pickupFrom > pickupTo) {
    throw new HttpError(400, "invalid_request", "Khoảng ngày lấy hàng không hợp lệ.");
  }

  const q = readText(query, "q", 80);
  const pickup = readText(query, "pickup", 80);
  const delivery = readText(query, "delivery", 80);
  const parsed: MarketplaceQuery = { sort: sortValue as MarketplaceSort };
  if (q !== undefined) parsed.q = q;
  if (temperature !== undefined) parsed.temperature = temperature as TemperatureGroup;
  if (pickup !== undefined) parsed.pickup = pickup;
  if (delivery !== undefined) parsed.delivery = delivery;
  if (weightMin !== undefined) parsed.weightMin = weightMin;
  if (weightMax !== undefined) parsed.weightMax = weightMax;
  if (pickupFrom !== undefined) parsed.pickupFrom = pickupFrom;
  if (pickupTo !== undefined) parsed.pickupTo = pickupTo;
  return parsed;
}

function escapePattern(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function marketplaceFilter(input: MarketplaceQuery) {
  const filter: {
    status: "PUBLISHED";
    carrierId: null;
    temperatureGroup?: TemperatureGroup;
    pickupLocation?: RegExp;
    deliveryLocation?: RegExp;
    cargoWeightTon?: { $gte?: number; $lte?: number };
    pickupDate?: { $gte?: string; $lte?: string };
    $and?: object[];
  } = {
    status: "PUBLISHED",
    carrierId: null,
  };
  const clauses: object[] = [];

  if (input.q) {
    const pattern = new RegExp(escapePattern(input.q), "i");
    clauses.push({
      $or: [{ cargoDescription: pattern }, { pickupLocation: pattern }, { deliveryLocation: pattern }],
    });
  }
  if (input.temperature) filter.temperatureGroup = input.temperature;
  if (input.pickup) filter.pickupLocation = new RegExp(escapePattern(input.pickup), "i");
  if (input.delivery) filter.deliveryLocation = new RegExp(escapePattern(input.delivery), "i");
  if (input.weightMin !== undefined || input.weightMax !== undefined) {
    filter.cargoWeightTon = {
      ...(input.weightMin !== undefined ? { $gte: input.weightMin } : {}),
      ...(input.weightMax !== undefined ? { $lte: input.weightMax } : {}),
    };
  }
  if (input.pickupFrom !== undefined || input.pickupTo !== undefined) {
    filter.pickupDate = {
      ...(input.pickupFrom !== undefined ? { $gte: input.pickupFrom } : {}),
      ...(input.pickupTo !== undefined ? { $lte: input.pickupTo } : {}),
    };
  }
  if (clauses.length > 0) filter.$and = clauses;
  return filter;
}

type SortableShipment = {
  _id: { toString(): string };
  createdAt?: Date;
  pickupDate?: string | null;
  pickupTimeFrom?: string | null;
  listedPriceVnd: number;
  cargoWeightTon?: number | null;
};

export function compareMarketplaceShipments(sort: MarketplaceSort) {
  return (left: SortableShipment, right: SortableShipment) => {
    const idOrder = left._id.toString().localeCompare(right._id.toString());
    if (sort === "newest") {
      const time = (right.createdAt?.getTime() ?? 0) - (left.createdAt?.getTime() ?? 0);
      return time !== 0 ? time : -idOrder;
    }
    if (sort === "oldest") {
      const time = (left.createdAt?.getTime() ?? 0) - (right.createdAt?.getTime() ?? 0);
      return time !== 0 ? time : idOrder;
    }
    if (sort === "pickup") {
      const leftDate = left.pickupDate && left.pickupDate.length > 0 ? left.pickupDate : "9999-99-99";
      const rightDate = right.pickupDate && right.pickupDate.length > 0 ? right.pickupDate : "9999-99-99";
      if (leftDate !== rightDate) return leftDate < rightDate ? -1 : 1;
      const leftTime = left.pickupTimeFrom && left.pickupTimeFrom.length > 0 ? left.pickupTimeFrom : "99:99";
      const rightTime = right.pickupTimeFrom && right.pickupTimeFrom.length > 0 ? right.pickupTimeFrom : "99:99";
      if (leftTime !== rightTime) return leftTime < rightTime ? -1 : 1;
      return idOrder;
    }
    if (sort === "price") {
      const price = left.listedPriceVnd - right.listedPriceVnd;
      return price !== 0 ? price : idOrder;
    }
    const leftWeight = typeof left.cargoWeightTon === "number" ? left.cargoWeightTon : Number.NEGATIVE_INFINITY;
    const rightWeight = typeof right.cargoWeightTon === "number" ? right.cargoWeightTon : Number.NEGATIVE_INFINITY;
    const weight = rightWeight - leftWeight;
    return weight !== 0 ? weight : idOrder;
  };
}
