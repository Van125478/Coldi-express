import { HttpError } from "../middlewares/errorHandler.js";

const allowedKeys = ["stars", "comment"] as const;

export type ReviewInput = { stars: number; comment: string };

export function readReviewInput(body: unknown): ReviewInput {
  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    throw new HttpError(400, "invalid_request", "Thiếu nội dung đánh giá.");
  }
  const record = body as Record<string, unknown>;
  for (const key of Object.keys(record)) {
    if (!allowedKeys.includes(key as (typeof allowedKeys)[number])) {
      throw new HttpError(400, "invalid_request", "Yêu cầu chứa trường không được phép.");
    }
  }
  const stars = record.stars;
  if (typeof stars !== "number" || !Number.isInteger(stars) || stars < 1 || stars > 5) {
    throw new HttpError(400, "invalid_request", "Số sao phải là số nguyên từ 1 đến 5.");
  }
  if (typeof record.comment !== "string") {
    throw new HttpError(400, "invalid_request", "Cần nhập nhận xét.");
  }
  const comment = record.comment.trim();
  if (comment.length === 0 || comment.length > 500) {
    throw new HttpError(400, "invalid_request", "Nhận xét cần từ 1 đến 500 ký tự.");
  }
  return { stars, comment };
}

export function readFavoriteShipmentId(body: unknown): string {
  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    throw new HttpError(400, "invalid_request", "Thiếu mã chuyến.");
  }
  const record = body as Record<string, unknown>;
  for (const key of Object.keys(record)) {
    if (key !== "shipmentId") throw new HttpError(400, "invalid_request", "Yêu cầu chứa trường không được phép.");
  }
  if (typeof record.shipmentId !== "string" || record.shipmentId.trim().length === 0) {
    throw new HttpError(400, "invalid_request", "Thiếu mã chuyến.");
  }
  return record.shipmentId.trim();
}
