import { randomBytes } from "node:crypto";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { isValidObjectId, Types } from "mongoose";
import { HttpError } from "../middlewares/errorHandler.js";
import { CargoImage, type CargoContentType } from "../models/cargoImage.js";
import { Shipment } from "../models/shipment.js";

/** Approved business rule is 1–5 images. Bytes, formats, and retention below are a TECHNICAL PROPOSAL. */
export const CARGO_IMAGE_LIMITS = {
  minCount: 1,
  maxCount: 5,
  maxBytes: 2_000_000,
  orphanAfterMs: 24 * 60 * 60 * 1000,
  formats: ["image/jpeg", "image/png", "image/webp"] as const,
};

const keyPattern = /^[a-f0-9]{32}$/;

export function detectCargoType(bytes: Buffer): CargoContentType | null {
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "image/jpeg";
  if (bytes.length >= 8 && bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47 && bytes[4] === 0x0d && bytes[5] === 0x0a && bytes[6] === 0x1a && bytes[7] === 0x0a) {
    return "image/png";
  }
  if (bytes.length >= 12 && bytes.subarray(0, 4).toString("ascii") === "RIFF" && bytes.subarray(8, 12).toString("ascii") === "WEBP") return "image/webp";
  return null;
}

export function cargoStorageRoot(): string {
  const configured = process.env.CARGO_IMAGE_DIR?.trim() ?? "";
  if (configured.length > 0) {
    if (!path.isAbsolute(configured)) {
      throw new HttpError(503, "cargo_storage_unavailable", "Thư mục lưu ảnh hàng hóa phải là đường dẫn tuyệt đối do máy chủ cấu hình.");
    }
    return path.resolve(configured);
  }
  if (process.env.NODE_ENV === "production") {
    throw new HttpError(503, "cargo_storage_unavailable", "Máy chủ production chưa cấu hình thư mục lưu ảnh hàng hóa.");
  }
  return path.join(os.tmpdir(), "coldi-cargo-images");
}

export async function storeCargoUpload(ownerId: string, declaredType: string, bytes: Buffer) {
  if (!CARGO_IMAGE_LIMITS.formats.includes(declaredType as CargoContentType)) {
    throw new HttpError(400, "invalid_request", "Ảnh hàng hóa chỉ nhận JPG, PNG hoặc WebP.", { cargoImages: "Ảnh hàng hóa chỉ nhận JPG, PNG hoặc WebP." });
  }
  if (bytes.length === 0 || bytes.length > CARGO_IMAGE_LIMITS.maxBytes) {
    throw new HttpError(400, "invalid_request", "Mỗi ảnh hàng hóa phải lớn hơn 0 và không quá 2 MB.", { cargoImages: "Mỗi ảnh hàng hóa phải lớn hơn 0 và không quá 2 MB." });
  }
  const detected = detectCargoType(bytes);
  if (detected == null || detected !== declaredType) {
    throw new HttpError(400, "invalid_request", "Nội dung tệp không khớp định dạng ảnh đã khai báo.", { cargoImages: "Nội dung tệp không khớp định dạng ảnh đã khai báo." });
  }
  await cleanupOrphanCargoImages();
  const root = cargoStorageRoot();
  await mkdir(root, { recursive: true });
  const storageKey = randomBytes(16).toString("hex");
  const target = safePath(root, storageKey);
  await writeFile(target, bytes, { flag: "wx" });
  try {
    const image = await CargoImage.create({
      ownerId,
      contentType: detected,
      sizeBytes: bytes.length,
      storageKey,
      shipmentId: null,
      reservation: null,
    });
    return { id: image._id.toString(), contentType: detected, sizeBytes: bytes.length };
  } catch (error) {
    await rm(target, { force: true });
    throw error;
  }
}

export async function readCargoBytes(imageId: string, userId: string, role: string): Promise<{ bytes: Buffer; contentType: CargoContentType }> {
  if (!isValidObjectId(imageId)) throw new HttpError(404, "not_found", "Không tìm thấy ảnh hàng hóa.");
  const image = await CargoImage.findById(imageId);
  if (!image) throw new HttpError(404, "not_found", "Không tìm thấy ảnh hàng hóa.");
  if (!(await canReadCargoImage(image.ownerId.toString(), image.shipmentId?.toString() ?? null, userId, role))) {
    throw new HttpError(404, "not_found", "Không tìm thấy ảnh hàng hóa.");
  }
  const root = cargoStorageRoot();
  const bytes = await readFile(safePath(root, image.storageKey));
  return { bytes, contentType: image.contentType };
}

export async function deleteUnattachedCargoImage(imageId: string, ownerId: string): Promise<void> {
  if (!isValidObjectId(imageId)) throw new HttpError(404, "not_found", "Không tìm thấy ảnh hàng hóa.");
  const image = await CargoImage.findOne({ _id: imageId, ownerId, shipmentId: null, reservation: null });
  if (!image) throw new HttpError(404, "not_found", "Không tìm thấy ảnh hàng hóa chưa gắn đơn.");
  const root = cargoStorageRoot();
  await rm(safePath(root, image.storageKey), { force: true });
  await CargoImage.deleteOne({ _id: image._id, shipmentId: null });
}

export async function reserveCargoImages(ownerId: string, body: unknown): Promise<{ ids: Types.ObjectId[]; token: string }> {
  const ids = readImageIds(body);
  const token = randomBytes(16).toString("hex");
  const reserved = await CargoImage.updateMany(
    { _id: { $in: ids }, ownerId, shipmentId: null, reservation: null },
    { $set: { reservation: token } },
  );
  if (reserved.modifiedCount !== ids.length) {
    await CargoImage.updateMany({ ownerId, reservation: token }, { $set: { reservation: null } });
    throw new HttpError(400, "invalid_request", "Ảnh hàng hóa không thuộc tài khoản này hoặc đã được dùng.", {
      cargoImageIds: "Chọn từ 1 đến 5 ảnh hàng hóa còn hiệu lực của chính đơn đang tạo.",
    });
  }
  return { ids, token };
}

export async function attachReservedCargoImages(ownerId: string, shipmentId: Types.ObjectId, token: string, ids: Types.ObjectId[]): Promise<void> {
  const attached = await CargoImage.updateMany(
    { _id: { $in: ids }, ownerId, reservation: token, shipmentId: null },
    { $set: { shipmentId, reservation: null } },
  );
  if (attached.modifiedCount !== ids.length) {
    await releaseCargoReservation(ownerId, token);
    throw new HttpError(409, "conflict", "Không gắn được ảnh hàng hóa vào đơn.");
  }
}

export async function releaseCargoReservation(ownerId: string, token: string): Promise<void> {
  await CargoImage.updateMany({ ownerId, reservation: token, shipmentId: null }, { $set: { reservation: null } });
}

export async function cleanupOrphanCargoImages(now = new Date()): Promise<void> {
  const cutoff = new Date(now.getTime() - CARGO_IMAGE_LIMITS.orphanAfterMs);
  const stale = await CargoImage.find({ shipmentId: null, reservation: null, createdAt: { $lt: cutoff } }).select("storageKey");
  if (stale.length === 0) return;
  let root: string;
  try {
    root = cargoStorageRoot();
  } catch {
    return;
  }
  for (const image of stale) {
    await rm(safePath(root, image.storageKey), { force: true });
    await CargoImage.deleteOne({ _id: image._id, shipmentId: null, reservation: null });
  }
}

async function canReadCargoImage(ownerId: string, shipmentId: string | null, userId: string, role: string): Promise<boolean> {
  if (role === "SHIPPER" && ownerId === userId && shipmentId == null) return true;
  if (shipmentId == null) return false;
  const shipment = await Shipment.findById(shipmentId).select("shipperId carrierId driverId status");
  if (!shipment) return false;
  if (role === "SHIPPER" && shipment.shipperId.toString() === userId) return true;
  if (role === "CARRIER") {
    if (shipment.carrierId?.toString() === userId) return true;
    if (shipment.status === "PUBLISHED" && shipment.carrierId == null) return true;
  }
  if (role === "DRIVER" && shipment.driverId?.toString() === userId) return true;
  return false;
}

function readImageIds(body: unknown): Types.ObjectId[] {
  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    throw new HttpError(400, "invalid_request", "Một số thông tin đơn chưa hợp lệ.", { cargoImageIds: "Thêm từ 1 đến 5 ảnh hàng hóa." });
  }
  const value = (body as Record<string, unknown>).cargoImageIds;
  if (!Array.isArray(value) || value.length < CARGO_IMAGE_LIMITS.minCount || value.length > CARGO_IMAGE_LIMITS.maxCount) {
    throw new HttpError(400, "invalid_request", "Một số thông tin đơn chưa hợp lệ.", { cargoImageIds: "Thêm từ 1 đến 5 ảnh hàng hóa." });
  }
  const ids: Types.ObjectId[] = [];
  const seen = new Set<string>();
  for (const item of value) {
    if (typeof item !== "string" || !isValidObjectId(item) || seen.has(item)) {
      throw new HttpError(400, "invalid_request", "Một số thông tin đơn chưa hợp lệ.", { cargoImageIds: "Danh sách ảnh hàng hóa không hợp lệ." });
    }
    seen.add(item);
    ids.push(new Types.ObjectId(item));
  }
  return ids;
}

function safePath(root: string, storageKey: string): string {
  if (!keyPattern.test(storageKey)) throw new HttpError(404, "not_found", "Không tìm thấy ảnh hàng hóa.");
  const target = path.resolve(root, storageKey);
  const relative = path.relative(path.resolve(root), target);
  if (relative.startsWith("..") || path.isAbsolute(relative)) {
    throw new HttpError(404, "not_found", "Không tìm thấy ảnh hàng hóa.");
  }
  return target;
}
