import { HttpError } from "../middlewares/errorHandler.js";
import { temperatureGroups, type TemperatureGroup } from "../models/shipment.js";

const forbiddenFields = ["shipperId", "status", "carrierId", "driverId", "role"] as const;

export type PublishInput = {
  cargoDescription: string;
  pickupLocation: string;
  deliveryLocation: string;
  temperatureGroup: TemperatureGroup;
  vehicleRequirement: string;
  listedPriceVnd: number;
};

function text(value: unknown, max: number): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (trimmed.length === 0 || trimmed.length > max) return null;
  return trimmed;
}

export function readPublishInput(body: unknown): PublishInput {
  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    throw new HttpError(400, "invalid_request", "Thông tin đơn chưa hợp lệ.");
  }
  const record = body as Record<string, unknown>;
  const present = forbiddenFields.filter((field) => field in record);
  if (present.length > 0) {
    throw new HttpError(400, "invalid_request", "Yêu cầu chứa trường không được phép.");
  }

  const fields: Record<string, string> = {};
  const cargoDescription = text(record.cargoDescription, 300);
  const pickupLocation = text(record.pickupLocation, 300);
  const deliveryLocation = text(record.deliveryLocation, 300);
  const vehicleRequirement = text(record.vehicleRequirement, 160);
  if (!cargoDescription) fields.cargoDescription = "Nhập mô tả hàng hóa.";
  if (!pickupLocation) fields.pickupLocation = "Nhập điểm lấy hàng.";
  if (!deliveryLocation) fields.deliveryLocation = "Nhập điểm giao hàng.";
  if (!vehicleRequirement) fields.vehicleRequirement = "Nhập yêu cầu xe.";

  const temperatureGroup = record.temperatureGroup;
  const temperatureOk = temperatureGroups.includes(temperatureGroup as TemperatureGroup);
  if (!temperatureOk) fields.temperatureGroup = "Chọn nhóm nhiệt Lạnh mát, Đông hoặc Cực lạnh.";

  const price = record.listedPriceVnd;
  const priceOk = typeof price === "number" && Number.isSafeInteger(price) && price >= 1;
  if (!priceOk) fields.listedPriceVnd = "Nhập giá cước niêm yết bằng số nguyên đồng, lớn hơn 0.";

  if (Object.keys(fields).length > 0 || !temperatureOk || !priceOk || !cargoDescription || !pickupLocation || !deliveryLocation || !vehicleRequirement) {
    throw new HttpError(400, "invalid_request", "Một số thông tin đơn chưa hợp lệ.", fields);
  }

  return {
    cargoDescription,
    pickupLocation,
    deliveryLocation,
    temperatureGroup: temperatureGroup as TemperatureGroup,
    vehicleRequirement,
    listedPriceVnd: price,
  };
}
