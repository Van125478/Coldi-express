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
  return {
    label: text(record.label, 1, 160, "Tên xe cần từ 1 đến 160 ký tự."),
    plate: plate(record.plate),
    vehicleKind: oneOf(record.vehicleKind, vehicleKinds, "Loại phương tiện không hợp lệ."),
    temperatureGroup: oneOf(record.temperatureGroup, temperatureGroups, "Nhóm nhiệt độ không hợp lệ."),
    capacityTon: capacity(record.capacityTon),
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
  if (typeof value !== "string") throw new HttpError(400, "invalid_request", message);
  const trimmed = value.trim();
  if (trimmed.length < min || trimmed.length > max) throw new HttpError(400, "invalid_request", message);
  return trimmed;
}

function plate(value: unknown): string {
  const trimmed = text(value, 2, 20, "Biển số cần từ 2 đến 20 ký tự.");
  if (!/^[\p{L}\p{N}][\p{L}\p{N} ./-]*$/u.test(trimmed)) {
    throw new HttpError(400, "invalid_request", "Biển số chỉ gồm chữ, số, khoảng trắng, dấu chấm, gạch hoặc gạch chéo.");
  }
  return trimmed;
}

function oneOf<T extends string>(value: unknown, options: readonly T[], message: string): T {
  if (typeof value !== "string" || !options.includes(value as T)) {
    throw new HttpError(400, "invalid_request", message);
  }
  return value as T;
}

function capacity(value: unknown): number {
  if (typeof value !== "number" || !Number.isFinite(value) || value <= 0 || value > 100) {
    throw new HttpError(400, "invalid_request", "Tải trọng phải lớn hơn 0 và không quá 100 tấn.");
  }
  const thousandths = Math.round(value * 1000);
  if (Math.abs(value * 1000 - thousandths) > 1e-6) {
    throw new HttpError(400, "invalid_request", "Tải trọng chỉ được tối đa 3 chữ số thập phân.");
  }
  return value;
}
