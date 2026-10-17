import { HttpError } from "../middlewares/errorHandler.js";

const allowed = new Set(["latitude", "longitude", "speedKmh", "bearingDeg", "observedAt"]);
const FUTURE_SKEW_MS = 2 * 60 * 1000;
const MAX_AGE_MS = 24 * 60 * 60 * 1000;

export type LocationSample = {
  latitude: number;
  longitude: number;
  speedKmh: number | null;
  bearingDeg: number | null;
  observedAt: Date;
};

export function readLocationSample(body: unknown, now = new Date()): LocationSample {
  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    throw new HttpError(400, "invalid_request", "Vị trí gửi lên không hợp lệ.");
  }
  const record = body as Record<string, unknown>;
  const unexpected = Object.keys(record).filter((key) => !allowed.has(key));
  if (unexpected.length > 0) {
    throw new HttpError(400, "invalid_request", "Yêu cầu vị trí chứa trường không được phép.");
  }
  const latitude = finite(record.latitude, -90, 90, "Vĩ độ không hợp lệ.");
  const longitude = finite(record.longitude, -180, 180, "Kinh độ không hợp lệ.");
  const speedKmh = optional(record.speedKmh, 0, 300, "Tốc độ không hợp lệ.");
  const bearingDeg = optional(record.bearingDeg, 0, 360, "Hướng không hợp lệ.");
  if (typeof record.observedAt !== "string") {
    throw new HttpError(400, "invalid_request", "Thiếu thời điểm quan sát vị trí.");
  }
  const observedAt = new Date(record.observedAt);
  if (Number.isNaN(observedAt.getTime())) {
    throw new HttpError(400, "invalid_request", "Thời điểm quan sát vị trí không hợp lệ.");
  }
  if (observedAt.getTime() > now.getTime() + FUTURE_SKEW_MS) {
    throw new HttpError(400, "invalid_request", "Thời điểm quan sát vị trí nằm quá xa trong tương lai.");
  }
  if (observedAt.getTime() < now.getTime() - MAX_AGE_MS) {
    throw new HttpError(409, "conflict", "Vị trí quan sát đã quá cũ để ghi nhận.");
  }
  return { latitude, longitude, speedKmh, bearingDeg, observedAt };
}

function finite(value: unknown, min: number, max: number, message: string): number {
  if (typeof value !== "number" || !Number.isFinite(value) || value < min || value > max) {
    throw new HttpError(400, "invalid_request", message);
  }
  return value;
}

function optional(value: unknown, min: number, max: number, message: string): number | null {
  if (value == null) return null;
  return finite(value, min, max, message);
}
