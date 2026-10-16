import { isValidObjectId } from "mongoose";
import { HttpError } from "../middlewares/errorHandler.js";

const forbiddenFields = ["carrierId", "status", "shipperId", "role", "vehicleLabel", "driverName"] as const;

export type AssignInput = {
  vehicleId: string;
  driverId: string;
};

export function readAssignInput(body: unknown): AssignInput {
  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    throw new HttpError(400, "invalid_request", "Thông tin phân công chưa hợp lệ.");
  }
  const record = body as Record<string, unknown>;
  if (forbiddenFields.some((field) => field in record)) {
    throw new HttpError(400, "invalid_request", "Yêu cầu chứa trường không được phép.");
  }
  const vehicleId = record.vehicleId;
  const driverId = record.driverId;
  if (typeof vehicleId !== "string" || !isValidObjectId(vehicleId) || typeof driverId !== "string" || !isValidObjectId(driverId)) {
    throw new HttpError(400, "invalid_request", "Xe hoặc tài xế không hợp lệ.");
  }
  return { vehicleId, driverId };
}
