import { randomBytes } from "node:crypto";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { isValidObjectId, Types } from "mongoose";
import { HttpError } from "../middlewares/errorHandler.js";
import { IncidentEvidence } from "../models/incidentEvidence.js";
import { Shipment } from "../models/shipment.js";
import { CARGO_IMAGE_LIMITS, detectCargoType } from "../shipments/cargoImages.js";
import { caseScope, type Actor } from "./access.js";
import { Incident } from "../models/incident.js";

export const INCIDENT_EVIDENCE_LIMITS = {
  maxCount: 5,
  maxBytes: CARGO_IMAGE_LIMITS.maxBytes,
  orphanAfterMs: CARGO_IMAGE_LIMITS.orphanAfterMs,
  formats: CARGO_IMAGE_LIMITS.formats,
} as const;

const keyPattern = /^[a-f0-9]{32}$/;

export function incidentEvidenceRoot(): string {
  const configured = process.env.INCIDENT_EVIDENCE_DIR?.trim() ?? "";
  if (configured.length > 0) {
    if (!path.isAbsolute(configured)) {
      throw new HttpError(503, "incident_evidence_unavailable", "Thư mục lưu ảnh chứng cứ phải là đường dẫn tuyệt đối do máy chủ cấu hình.");
    }
    return path.resolve(configured);
  }
  if (process.env.NODE_ENV === "production") {
    throw new HttpError(503, "incident_evidence_unavailable", "Máy chủ production chưa cấu hình thư mục lưu ảnh chứng cứ.");
  }
  return path.join(os.tmpdir(), "coldi-incident-evidence-storage");
}

export async function storeIncidentEvidence(ownerId: string, declaredType: string, bytes: Buffer) {
  if (!INCIDENT_EVIDENCE_LIMITS.formats.includes(declaredType as (typeof INCIDENT_EVIDENCE_LIMITS.formats)[number])) {
    throw new HttpError(400, "invalid_request", "Ảnh chứng cứ chỉ nhận JPG, PNG hoặc WebP.", { evidenceIds: "Ảnh chứng cứ chỉ nhận JPG, PNG hoặc WebP." });
  }
  if (bytes.length === 0 || bytes.length > INCIDENT_EVIDENCE_LIMITS.maxBytes) {
    throw new HttpError(400, "invalid_request", "Mỗi ảnh chứng cứ phải lớn hơn 0 và không quá 2 MB.", { evidenceIds: "Mỗi ảnh chứng cứ phải lớn hơn 0 và không quá 2 MB." });
  }
  const detected = detectCargoType(bytes);
  if (detected == null || detected !== declaredType) {
    throw new HttpError(400, "invalid_request", "Nội dung tệp không khớp định dạng ảnh đã khai báo.", { evidenceIds: "Nội dung tệp không khớp định dạng ảnh đã khai báo." });
  }
  await cleanupOrphanIncidentEvidence();
  const root = incidentEvidenceRoot();
  await mkdir(root, { recursive: true });
  const storageKey = randomBytes(16).toString("hex");
  const target = safePath(root, storageKey);
  await writeFile(target, bytes, { flag: "wx" });
  try {
    const image = await IncidentEvidence.create({
      ownerId,
      contentType: detected,
      sizeBytes: bytes.length,
      storageKey,
      incidentId: null,
    });
    return { id: image._id.toString(), contentType: detected, sizeBytes: bytes.length };
  } catch (error) {
    await rm(target, { force: true });
    throw error;
  }
}

export async function deleteUnattachedIncidentEvidence(imageId: string, ownerId: string): Promise<void> {
  if (!isValidObjectId(imageId)) throw new HttpError(404, "not_found", "Không tìm thấy ảnh chứng cứ.");
  const image = await IncidentEvidence.findOne({ _id: imageId, ownerId, incidentId: null });
  if (!image) throw new HttpError(404, "not_found", "Không tìm thấy ảnh chứng cứ.");
  await rm(safePath(incidentEvidenceRoot(), image.storageKey), { force: true });
  await IncidentEvidence.deleteOne({ _id: image._id, incidentId: null });
}

export async function attachIncidentEvidence(ownerId: string, incidentId: Types.ObjectId, evidenceIds: string[]): Promise<string[]> {
  if (evidenceIds.length === 0) return [];
  const ids = evidenceIds.map((id) => new Types.ObjectId(id));
  const matched = await IncidentEvidence.countDocuments({ _id: { $in: ids }, ownerId, incidentId: null });
  if (matched !== ids.length) {
    throw new HttpError(400, "invalid_request", "Ảnh chứng cứ không thuộc tài khoản này hoặc đã được dùng.", {
      evidenceIds: "Chọn tối đa 5 ảnh chứng cứ còn hiệu lực của chính báo cáo đang gửi.",
    });
  }
  const attached = await IncidentEvidence.updateMany({ _id: { $in: ids }, ownerId, incidentId: null }, { $set: { incidentId } });
  if (attached.modifiedCount !== ids.length) {
    await IncidentEvidence.updateMany({ _id: { $in: ids }, ownerId, incidentId }, { $set: { incidentId: null } });
    throw new HttpError(409, "conflict", "Không gắn được ảnh chứng cứ vào báo cáo.");
  }
  return evidenceIds;
}

export async function readIncidentEvidence(imageId: string, actor: Actor): Promise<{ bytes: Buffer; contentType: string }> {
  if (!isValidObjectId(imageId)) throw new HttpError(404, "not_found", "Không tìm thấy ảnh chứng cứ.");
  const image = await IncidentEvidence.findById(imageId);
  if (!image) throw new HttpError(404, "not_found", "Không tìm thấy ảnh chứng cứ.");
  const allowed = image.incidentId == null ? image.ownerId.toString() === actor.id : await canReadAttached(image.incidentId.toString(), actor);
  if (!allowed) throw new HttpError(404, "not_found", "Không tìm thấy ảnh chứng cứ.");
  const bytes = await readFile(safePath(incidentEvidenceRoot(), image.storageKey));
  return { bytes, contentType: image.contentType };
}

async function canReadAttached(incidentId: string, actor: Actor): Promise<boolean> {
  const incident = await Incident.findById(incidentId).select("reporterId reporterRole handlerId status shipmentId");
  if (!incident) return false;
  const shipment = await Shipment.findById(incident.shipmentId).select("shipperId carrierId driverId status");
  if (!shipment) return false;
  return (
    caseScope(
      actor,
      {
        reporterId: incident.reporterId.toString(),
        reporterRole: incident.reporterRole,
        handlerId: incident.handlerId ? incident.handlerId.toString() : null,
        status: incident.status,
      },
      {
        id: shipment._id.toString(),
        shipperId: shipment.shipperId.toString(),
        carrierId: shipment.carrierId ? shipment.carrierId.toString() : null,
        driverId: shipment.driverId ? shipment.driverId.toString() : null,
        status: shipment.status,
      },
    ) !== "none"
  );
}

async function cleanupOrphanIncidentEvidence(now = new Date()): Promise<void> {
  const cutoff = new Date(now.getTime() - INCIDENT_EVIDENCE_LIMITS.orphanAfterMs);
  const stale = await IncidentEvidence.find({ incidentId: null, createdAt: { $lt: cutoff } }).select("storageKey");
  if (stale.length === 0) return;
  let root: string;
  try {
    root = incidentEvidenceRoot();
  } catch {
    return;
  }
  for (const image of stale) {
    await rm(safePath(root, image.storageKey), { force: true });
    await IncidentEvidence.deleteOne({ _id: image._id, incidentId: null });
  }
}

function safePath(root: string, storageKey: string): string {
  if (!keyPattern.test(storageKey)) throw new HttpError(404, "not_found", "Không tìm thấy ảnh chứng cứ.");
  const target = path.resolve(root, storageKey);
  const relative = path.relative(path.resolve(root), target);
  if (relative.startsWith("..") || path.isAbsolute(relative)) throw new HttpError(404, "not_found", "Không tìm thấy ảnh chứng cứ.");
  return target;
}
