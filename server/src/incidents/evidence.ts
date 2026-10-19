import { randomBytes } from "node:crypto";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { isValidObjectId, Types } from "mongoose";
import { HttpError } from "../middlewares/errorHandler.js";
import { IncidentEvidence } from "../models/incidentEvidence.js";
import { IncidentEvent } from "../models/incidentEvent.js";
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

/** A fresh claim is left alone this long so an in-flight incident write can finish. */
export const RESOLUTION_CLAIM_GRACE_MS = 60_000;

type ResolutionCommit =
  | { committed: false }
  | { committed: true; evidenceIds: string[] };

async function resolutionCommitState(incidentId: Types.ObjectId, resolutionKey: string): Promise<ResolutionCommit> {
  const [incident, event] = await Promise.all([
    Incident.findById(incidentId).select("appliedKeys pendingEvents").lean<{
      appliedKeys?: string[];
      pendingEvents?: { idempotencyKey: string; evidenceIds?: string[] }[];
    } | null>(),
    IncidentEvent.findOne({ incidentId, idempotencyKey: resolutionKey }).select("evidenceIds").lean<{ evidenceIds?: string[] } | null>(),
  ]);
  const pending = incident?.pendingEvents?.find((item) => item.idempotencyKey === resolutionKey);
  const applied = incident?.appliedKeys?.includes(resolutionKey) === true;
  if (!pending && !applied && !event) return { committed: false };
  const pendingIds = pending?.evidenceIds ?? [];
  const eventIds = event?.evidenceIds ?? [];
  return { committed: true, evidenceIds: pendingIds.length > 0 ? pendingIds : eventIds };
}

/**
 * Reserves uploads for one resolution key.
 * A committed key is never rewritten. An uncommitted retry with a different image set replaces that reservation.
 * A failed claim releases only the images this attempt reserved.
 */
export async function claimResolutionEvidence(ownerId: string, incidentId: Types.ObjectId, resolutionKey: string, evidenceIds: string[]): Promise<void> {
  if (evidenceIds.length === 0) return;
  if ((await resolutionCommitState(incidentId, resolutionKey)).committed) return;
  const ids = evidenceIds.map((id) => new Types.ObjectId(id));
  const now = new Date();
  await IncidentEvidence.updateMany(
    { ownerId, incidentId, resolutionKey, _id: { $nin: ids } },
    { $set: { incidentId: null, resolutionKey: null, claimedAt: null } },
  );
  const raced = await resolutionCommitState(incidentId, resolutionKey);
  if (raced.committed) {
    await ensureResolutionEvidenceBound(ownerId, incidentId, resolutionKey, raced.evidenceIds);
    return;
  }
  await IncidentEvidence.updateMany(
    {
      _id: { $in: ids },
      ownerId,
      $or: [
        { incidentId: null, resolutionKey: null },
        { incidentId, resolutionKey },
      ],
    },
    { $set: { incidentId, resolutionKey, claimedAt: now } },
  );
  const held = await IncidentEvidence.countDocuments({ _id: { $in: ids }, ownerId, incidentId, resolutionKey });
  if (held === ids.length) return;
  const committedDuringClaim = await resolutionCommitState(incidentId, resolutionKey);
  if (committedDuringClaim.committed) {
    await ensureResolutionEvidenceBound(ownerId, incidentId, resolutionKey, committedDuringClaim.evidenceIds);
    return;
  }
  await releaseResolutionClaim(ownerId, incidentId, resolutionKey);
  throw new HttpError(400, "invalid_request", "Ảnh kết quả xử lý không thuộc tài khoản này hoặc đã được dùng.", {
    evidenceIds: "Chọn tối đa 5 ảnh còn hiệu lực của chính nhà xe đang gửi kết quả.",
  });
}

/** Reattaches the stored image set for a resolution that already committed, including images freed by a stale release. */
export async function ensureResolutionEvidenceBound(
  ownerId: string,
  incidentId: Types.ObjectId,
  resolutionKey: string,
  evidenceIds: string[],
): Promise<void> {
  if (evidenceIds.length === 0) return;
  const ids = evidenceIds.map((id) => new Types.ObjectId(id));
  await IncidentEvidence.updateMany(
    {
      _id: { $in: ids },
      ownerId,
      $or: [
        { incidentId: null, resolutionKey: null },
        { incidentId: null, resolutionKey },
        { incidentId, resolutionKey },
      ],
    },
    { $set: { incidentId, resolutionKey, claimedAt: new Date() } },
  );
}

/**
 * Clears a reservation only after a fresh read shows no pending event, applied key, or timeline event.
 * A committed resolution is rebound instead of detached.
 */
export async function releaseResolutionClaim(ownerId: string, incidentId: Types.ObjectId, resolutionKey: string): Promise<void> {
  const state = await resolutionCommitState(incidentId, resolutionKey);
  if (state.committed) {
    await ensureResolutionEvidenceBound(ownerId, incidentId, resolutionKey, state.evidenceIds);
    return;
  }
  await IncidentEvidence.updateMany(
    { ownerId, incidentId, resolutionKey },
    { $set: { incidentId: null, resolutionKey: null, claimedAt: null } },
  );
}

/** Frees reservations whose resolution never committed. Claims younger than the grace period stay reserved. */
export async function releaseAbandonedResolutionClaims(
  incidentId: Types.ObjectId,
  now = new Date(),
  graceMs = RESOLUTION_CLAIM_GRACE_MS,
): Promise<number> {
  const reserved = await IncidentEvidence.find({ incidentId, resolutionKey: { $ne: null } }).select("ownerId resolutionKey claimedAt");
  const grouped = new Map<string, { ownerId: string; claimedAt: Date | null }>();
  for (const image of reserved) {
    const key = image.resolutionKey;
    if (!key) continue;
    const claimedAt = image.claimedAt ?? null;
    const existing = grouped.get(key);
    if (!existing) {
      grouped.set(key, { ownerId: image.ownerId.toString(), claimedAt });
      continue;
    }
    if (claimedAt && (!existing.claimedAt || claimedAt > existing.claimedAt)) existing.claimedAt = claimedAt;
  }
  const cutoff = now.getTime() - graceMs;
  let released = 0;
  for (const [key, info] of grouped) {
    if (info.claimedAt && info.claimedAt.getTime() > cutoff) continue;
    const before = await IncidentEvidence.countDocuments({ incidentId, resolutionKey: key });
    await releaseResolutionClaim(info.ownerId, incidentId, key);
    const after = await IncidentEvidence.countDocuments({ incidentId, resolutionKey: key });
    released += Math.max(0, before - after);
  }
  return released;
}

export async function assertResolutionEvidenceHeld(incidentId: Types.ObjectId, resolutionKey: string, evidenceIds: string[]): Promise<void> {
  if (evidenceIds.length === 0) return;
  const ids = evidenceIds.map((id) => new Types.ObjectId(id));
  const held = await IncidentEvidence.countDocuments({ _id: { $in: ids }, incidentId, resolutionKey });
  if (held !== ids.length) {
    throw new HttpError(500, "incident_audit_incomplete", "Kết quả đã lưu nhưng ảnh chưa gắn xong. Hãy gửi lại cùng mã idempotency.");
  }
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

export async function cleanupOrphanIncidentEvidence(now = new Date()): Promise<void> {
  const cutoff = new Date(now.getTime() - INCIDENT_EVIDENCE_LIMITS.orphanAfterMs);
  const stale = await IncidentEvidence.find({ incidentId: null, resolutionKey: null, createdAt: { $lt: cutoff } }).select("storageKey");
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
