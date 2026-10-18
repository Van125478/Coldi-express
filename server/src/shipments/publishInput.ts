import { HttpError } from "../middlewares/errorHandler.js";
import { temperatureGroups, type TemperatureGroup } from "../models/shipment.js";

const forbiddenFields = ["shipperId", "status", "carrierId", "vehicleId", "driverId", "role", "tenantId", "senderId", "rateBps", "calculatedFeeVnd", "planVersionId", "payerAccountId", "commission", "paymentCollected"] as const;

export type PublishInput = {
  cargoDescription: string;
  pickupCompany: string;
  pickupLocation: string;
  pickupContactName: string;
  pickupPhone: string;
  pickupEmail: string | null;
  pickupDate: string;
  pickupTimeFrom: string;
  pickupTimeTo: string;
  deliveryCompany: string;
  deliveryLocation: string;
  deliveryContactName: string;
  deliveryPhone: string;
  deliveryEmail: string | null;
  deliveryDate: string;
  deliveryTimeFrom: string;
  deliveryTimeTo: string;
  cargoWeightTon: number;
  cargoVolumeM3: number;
  packageCount: number;
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

function phone(value: unknown): string | null {
  const trimmed = text(value, 20);
  if (!trimmed || trimmed.length < 8) return null;
  const digits = trimmed.replace(/\D/g, "");
  if (digits.length < 8 || digits.length > 15) return null;
  return trimmed;
}

function optionalEmail(value: unknown): string | null | undefined {
  if (value === undefined || value === null || value === "") return null;
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim().toLowerCase();
  if (trimmed.length === 0) return null;
  if (trimmed.length > 160 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) return undefined;
  return trimmed;
}

function calendarDate(value: unknown): string | null {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const year = Number(value.slice(0, 4));
  const month = Number(value.slice(5, 7));
  const day = Number(value.slice(8, 10));
  const date = new Date(Date.UTC(year, month - 1, day));
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) return null;
  return value;
}

function clock(value: unknown): string | null {
  if (typeof value !== "string" || !/^([01]\d|2[0-3]):[0-5]\d$/.test(value)) return null;
  return value;
}

function measure(value: unknown): number | null {
  if (typeof value !== "number" || !Number.isFinite(value) || value <= 0 || value > 100000) return null;
  const scaled = Math.round(value * 1000);
  if (Math.abs(value * 1000 - scaled) > 1e-6) return null;
  return scaled / 1000;
}

export function readPublishInput(body: unknown): PublishInput {
  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    throw new HttpError(400, "invalid_request", "Thông tin đơn chưa hợp lệ.");
  }
  const record = body as Record<string, unknown>;
  if (forbiddenFields.some((field) => field in record)) {
    throw new HttpError(400, "invalid_request", "Yêu cầu chứa trường không được phép.");
  }

  const fields: Record<string, string> = {};
  const cargoDescription = text(record.cargoDescription, 300);
  const pickupCompany = text(record.pickupCompany, 160);
  const pickupLocation = text(record.pickupLocation, 300);
  const pickupContactName = text(record.pickupContactName, 160);
  const pickupPhone = phone(record.pickupPhone);
  const pickupEmail = optionalEmail(record.pickupEmail);
  const pickupDate = calendarDate(record.pickupDate);
  const pickupTimeFrom = clock(record.pickupTimeFrom);
  const pickupTimeTo = clock(record.pickupTimeTo);
  const deliveryCompany = text(record.deliveryCompany, 160);
  const deliveryLocation = text(record.deliveryLocation, 300);
  const deliveryContactName = text(record.deliveryContactName, 160);
  const deliveryPhone = phone(record.deliveryPhone);
  const deliveryEmail = optionalEmail(record.deliveryEmail);
  const deliveryDate = calendarDate(record.deliveryDate);
  const deliveryTimeFrom = clock(record.deliveryTimeFrom);
  const deliveryTimeTo = clock(record.deliveryTimeTo);
  const cargoWeightTon = measure(record.cargoWeightTon);
  const cargoVolumeM3 = measure(record.cargoVolumeM3);
  const packageCount = record.packageCount;
  const packageOk = typeof packageCount === "number" && Number.isSafeInteger(packageCount) && packageCount >= 1 && packageCount <= 1000000;
  const vehicleRequirement = text(record.vehicleRequirement, 160);
  const temperatureGroup = record.temperatureGroup;
  const temperatureOk = temperatureGroups.includes(temperatureGroup as TemperatureGroup);
  const price = record.listedPriceVnd;
  const priceOk = typeof price === "number" && Number.isSafeInteger(price) && price >= 1;

  if (!cargoDescription) fields.cargoDescription = "Nhập mô tả hàng hóa.";
  if (!pickupCompany) fields.pickupCompany = "Nhập tên công ty hoặc kho gửi.";
  if (!pickupLocation) fields.pickupLocation = "Nhập địa chỉ lấy hàng.";
  if (!pickupContactName) fields.pickupContactName = "Nhập người bốc hàng.";
  if (!pickupPhone) fields.pickupPhone = "Nhập số điện thoại lấy hàng.";
  if (pickupEmail === undefined) fields.pickupEmail = "Email nhận thông báo chưa hợp lệ.";
  if (!pickupDate) fields.pickupDate = "Chọn ngày lấy hàng hợp lệ.";
  if (!pickupTimeFrom || !pickupTimeTo || pickupTimeFrom >= pickupTimeTo) {
    fields.pickupTimeTo = "Khung giờ bốc hàng phải có giờ bắt đầu sớm hơn giờ kết thúc.";
  }
  if (!deliveryCompany) fields.deliveryCompany = "Nhập tên công ty hoặc kho nhận.";
  if (!deliveryLocation) fields.deliveryLocation = "Nhập địa chỉ giao hàng.";
  if (!deliveryContactName) fields.deliveryContactName = "Nhập người nhận hàng.";
  if (!deliveryPhone) fields.deliveryPhone = "Nhập số điện thoại giao hàng.";
  if (deliveryEmail === undefined) fields.deliveryEmail = "Email kho nhận chưa hợp lệ.";
  if (!deliveryDate) fields.deliveryDate = "Chọn ngày giao hàng hợp lệ.";
  if (pickupDate && deliveryDate && deliveryDate < pickupDate) {
    fields.deliveryDate = "Ngày giao muộn nhất không được trước ngày lấy hàng.";
  }
  if (!deliveryTimeFrom || !deliveryTimeTo || deliveryTimeFrom >= deliveryTimeTo) {
    fields.deliveryTimeTo = "Khung giờ nhận hàng phải có giờ bắt đầu sớm hơn giờ kết thúc.";
  }
  if (cargoWeightTon === null) fields.cargoWeightTon = "Nhập trọng lượng bằng tấn, lớn hơn 0.";
  if (cargoVolumeM3 === null) fields.cargoVolumeM3 = "Nhập thể tích bằng mét khối, lớn hơn 0.";
  if (!packageOk) fields.packageCount = "Nhập số thùng bằng số nguyên, lớn hơn 0.";
  if (!temperatureOk) fields.temperatureGroup = "Chọn nhóm nhiệt Lạnh mát, Đông hoặc Cực lạnh.";
  if (!vehicleRequirement) fields.vehicleRequirement = "Nhập yêu cầu xe.";
  if (!priceOk) fields.listedPriceVnd = "Nhập giá cước niêm yết bằng số nguyên đồng, lớn hơn 0.";

  if (
    Object.keys(fields).length > 0 ||
    !cargoDescription ||
    !pickupCompany ||
    !pickupLocation ||
    !pickupContactName ||
    !pickupPhone ||
    pickupEmail === undefined ||
    !pickupDate ||
    !pickupTimeFrom ||
    !pickupTimeTo ||
    !deliveryCompany ||
    !deliveryLocation ||
    !deliveryContactName ||
    !deliveryPhone ||
    deliveryEmail === undefined ||
    !deliveryDate ||
    !deliveryTimeFrom ||
    !deliveryTimeTo ||
    cargoWeightTon === null ||
    cargoVolumeM3 === null ||
    !packageOk ||
    !temperatureOk ||
    !vehicleRequirement ||
    !priceOk
  ) {
    throw new HttpError(400, "invalid_request", "Một số thông tin đơn chưa hợp lệ.", fields);
  }

  return {
    cargoDescription,
    pickupCompany,
    pickupLocation,
    pickupContactName,
    pickupPhone,
    pickupEmail,
    pickupDate,
    pickupTimeFrom,
    pickupTimeTo,
    deliveryCompany,
    deliveryLocation,
    deliveryContactName,
    deliveryPhone,
    deliveryEmail,
    deliveryDate,
    deliveryTimeFrom,
    deliveryTimeTo,
    cargoWeightTon,
    cargoVolumeM3,
    packageCount,
    temperatureGroup: temperatureGroup as TemperatureGroup,
    vehicleRequirement,
    listedPriceVnd: price,
  };
}
