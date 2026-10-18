import { HttpError } from "../middlewares/errorHandler.js";
import { temperatureGroups, temperatureLabels, type TemperatureGroup } from "../models/shipment.js";
import { vehicleKindLabels, vehicleKinds, type VehicleKind } from "../models/vehicle.js";

export type VehicleInput = {
  label: string;
  plate: string;
  vehicleKind: VehicleKind;
  temperatureGroup: TemperatureGroup;
  capacityTon: number;
};

const allowed = new Set(["label", "plate", "vehicleKind", "temperatureGroup", "capacityTon"]);

export function readVehicleInput(body: unknown): VehicleInput {
  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    throw new HttpError(400, "invalid_request", "Thông tin xe không hợp lệ.");
  }
  const record = body as Record<string, unknown>;
  if (Object.keys(record).some((key) => !allowed.has(key))) {
    throw new HttpError(400, "invalid_request", "Yêu cầu chứa trường không được phép.");
  }
  const fields: Record<string, string> = {};
  const label = textOrError(record.label, 1, 160, "Tên xe cần từ 1 đến 160 ký tự.");
  const plateValue = plateOrError(record.plate);
  const vehicleKind = oneOfOrError(record.vehicleKind, vehicleKinds, "Loại phương tiện không hợp lệ.");
  const temperatureGroup = oneOfOrError(record.temperatureGroup, temperatureGroups, "Nhóm nhiệt độ không hợp lệ.");
  const capacityTon = capacityOrError(record.capacityTon);
  if (typeof label !== "string") fields.label = label.message;
  if (typeof plateValue !== "string") fields.plate = plateValue.message;
  if (typeof vehicleKind !== "string") fields.vehicleKind = vehicleKind.message;
  if (typeof temperatureGroup !== "string") fields.temperatureGroup = temperatureGroup.message;
  if (typeof capacityTon !== "number") fields.capacityTon = capacityTon.message;
  if (typeof label !== "string" || typeof plateValue !== "string" || typeof vehicleKind !== "string" || typeof temperatureGroup !== "string" || typeof capacityTon !== "number") {
    throw new HttpError(400, "invalid_request", "Một số thông tin xe chưa hợp lệ.", fields);
  }
  return {
    label,
    plate: plateValue,
    vehicleKind,
    temperatureGroup,
    capacityTon,
  };
}

export function readDriverName(body: unknown): string {
  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    throw new HttpError(400, "invalid_request", "Hồ sơ tài xế không hợp lệ.");
  }
  const record = body as Record<string, unknown>;
  if (Object.keys(record).some((key) => key !== "displayName")) {
    throw new HttpError(400, "invalid_request", "Yêu cầu chứa trường không được phép.");
  }
  return text(record.displayName, 1, 80, "Tên hiển thị cần từ 1 đến 80 ký tự.");
}

export function vehicleKindLabel(kind: VehicleKind | null | undefined): string | null {
  return kind ? vehicleKindLabels[kind] : null;
}

export function temperatureLabel(group: TemperatureGroup | null | undefined): string | null {
  return group ? temperatureLabels[group] : null;
}

function text(value: unknown, min: number, max: number, message: string): string {
  const parsed = textOrError(value, min, max, message);
  if (typeof parsed !== "string") throw new HttpError(400, "invalid_request", parsed.message, { displayName: parsed.message });
  return parsed;
}

function textOrError(value: unknown, min: number, max: number, message: string): string | { message: string } {
  if (typeof value !== "string") return { message };
  const trimmed = value.trim();
  if (trimmed.length < min || trimmed.length > max) return { message };
  return trimmed;
}

function plateOrError(value: unknown): string | { message: string } {
  const trimmed = textOrError(value, 2, 20, "Biển số cần từ 2 đến 20 ký tự.");
  if (typeof trimmed !== "string") return trimmed;
  if (!/^[\p{L}\p{N}][\p{L}\p{N} ./-]*$/u.test(trimmed)) {
    return { message: "Biển số chỉ gồm chữ, số, khoảng trắng, dấu chấm, gạch hoặc gạch chéo." };
  }
  return trimmed;
}

function oneOfOrError<T extends string>(value: unknown, options: readonly T[], message: string): T | { message: string } {
  if (typeof value !== "string" || !options.includes(value as T)) return { message };
  return value as T;
}

function capacityOrError(value: unknown): number | { message: string } {
  if (typeof value !== "number" || !Number.isFinite(value) || value <= 0 || value > 100) {
    return { message: "Tải trọng phải lớn hơn 0 và không quá 100 tấn." };
  }
  const thousandths = Math.round(value * 1000);
  if (Math.abs(value * 1000 - thousandths) > 1e-6) {
    return { message: "Tải trọng chỉ được tối đa 3 chữ số thập phân." };
  }
  return value;
}
