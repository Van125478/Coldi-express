import { HttpError } from "../middlewares/errorHandler.js";

export const MAX_MESSAGE_LENGTH = 2000;

export function readMessageBody(body: unknown): string {
  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    throw new HttpError(400, "invalid_request", "Tin nhắn không hợp lệ.");
  }
  const record = body as Record<string, unknown>;
  if (Object.keys(record).some((key) => key !== "body")) {
    throw new HttpError(400, "invalid_request", "Yêu cầu chứa trường không được phép.");
  }
  if (typeof record.body !== "string") {
    throw new HttpError(400, "invalid_request", "Nội dung tin nhắn không hợp lệ.");
  }
  const text = record.body.trim();
  if (text.length === 0) {
    throw new HttpError(400, "invalid_request", "Nội dung tin nhắn không được để trống.");
  }
  if (text.length > MAX_MESSAGE_LENGTH) {
    throw new HttpError(400, "invalid_request", "Tin nhắn vượt quá 2000 ký tự.");
  }
  return text;
}

export function readEmptyBody(body: unknown) {
  if (body == null || body === "") return;
  if (typeof body !== "object" || Array.isArray(body) || Object.keys(body as Record<string, unknown>).length > 0) {
    throw new HttpError(400, "invalid_request", "Yêu cầu chứa trường không được phép.");
  }
}
