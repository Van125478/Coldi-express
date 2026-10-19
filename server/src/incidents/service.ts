import { randomUUID } from "node:crypto";
import { isValidObjectId, type Types } from "mongoose";
import { readCorrelationId } from "../audit/recordAudit.js";
import { HttpError } from "../middlewares/errorHandler.js";
import { Incident } from "../models/incident.js";
import { IncidentEvent } from "../models/incidentEvent.js";
import { IncidentNotification } from "../models/incidentNotification.js";
import { Shipment } from "../models/shipment.js";
import type { Actor, IncidentAccess, ShipmentAccess } from "./access.js";
import {
  canAdjudicateReopen,
  canClose,
  canComment,
  canObject,
  canRequestReopen,
  canRespondReopen,
  carrierWindowOpen,
  caseScope,
  createDecision,
  isCarrierHandler,
  recipientIds,
} from "./access.js";
import {
  assertResolutionEvidenceHeld,
  attachIncidentEvidence,
  claimResolutionEvidence,
  ensureResolutionEvidenceBound,
  releaseAbandonedResolutionClaims,
  releaseResolutionClaim,
} from "./evidence.js";
import {
  closeTransition,
  initialEscalationStatus,
  initialIncidentStatus,
  primaryTransition,
  reopenDeadline,
  reopenTransition,
  type PrimaryAction,
  type ReopenAction,
} from "./lifecycle.js";
import type { EscalationStatus, IncidentAction, IncidentStatus, IncidentType, ReopenEscalationCause, ReopenStatus } from "./policy.js";
import { appliedKeyLimit, incidentLimits, incidentStatuses, pageDefault, reopenCarrierWindowMs } from "./policy.js";
import { toEventView, toIncidentView, toNotificationView, type IncidentEventView, type IncidentView, type NotificationView } from "./present.js";

type Id = Types.ObjectId;

export type StoredIncident = {
  _id: Id;
  shipmentId: Id;
  shipperId: Id;
  incidentType: IncidentType;
  title: string;
  description: string;
  occurredAt?: Date | null;
  reportedAt: Date;
  reporterId: Id;
  reporterRole: "SHIPPER" | "CARRIER" | "DRIVER";
  carrierId?: Id | null;
  handlerId?: Id | null;
  status: IncidentStatus;
  escalationStatus: EscalationStatus;
  version: number;
  resolutionSummary?: string | null;
  resolvedAt?: Date | null;
  resolvedBy?: Id | null;
  objectionReason?: string | null;
  objectedAt?: Date | null;
  objectedBy?: Id | null;
  closedAt?: Date | null;
  closedBy?: Id | null;
  closeReason?: string | null;
  reopenStatus?: ReopenStatus | null;
  reopenRequestId?: string | null;
  reopenRequestedAt?: Date | null;
  reopenRequestedBy?: Id | null;
  reopenReason?: string | null;
  reopenCarrierDeadlineAt?: Date | null;
  reopenCarrierRespondedAt?: Date | null;
  reopenCarrierRespondedBy?: Id | null;
  reopenCarrierNote?: string | null;
  reopenEscalatedAt?: Date | null;
  reopenEscalationCause?: ReopenEscalationCause | null;
  reopenAdminDecidedAt?: Date | null;
  reopenAdminDecidedBy?: Id | null;
  reopenAdminReason?: string | null;
  idempotencyKey: string;
  appliedKeys?: string[];
  attachments?: string[];
  pendingEvents?: PendingEvent[];
  createdAt: Date;
  updatedAt: Date;
};

type EventRole = Actor["role"] | "SYSTEM";

type EventActor = { id: string | null; role: EventRole };

type PendingEvent = {
  idempotencyKey: string;
  action: IncidentAction;
  actorId?: Id | string | null;
  actorRole: EventRole;
  statusBefore: IncidentStatus;
  statusAfter: IncidentStatus;
  note?: string;
  occurredAt?: Date | null;
  correlationId: string;
  evidenceIds?: string[];
};

type StoredEvent = {
  _id: Id;
  incidentId: Id;
  action: IncidentAction;
  actorId?: Id | null;
  actorRole: EventRole;
  occurredAt: Date;
  statusBefore: IncidentStatus;
  statusAfter: IncidentStatus;
  escalationBefore: EscalationStatus;
  escalationAfter: EscalationStatus;
  note?: string;
  evidenceIds?: string[];
  idempotencyKey: string;
  correlationId: string;
  visibility: "PARTICIPANT" | "INTERNAL";
};

type ShipmentContext = ShipmentAccess & { label: string };

const notificationLabels: Record<IncidentAction, string> = {
  CREATED: "Có sự cố mới trên chuyến hàng",
  ACKNOWLEDGED: "Sự cố đã được tiếp nhận",
  INVESTIGATION_STARTED: "Sự cố đang được xử lý",
  COMMENT: "Có cập nhật mới trên sự cố",
  RESOLVED: "Sự cố đã có kết quả xử lý",
  OBJECTED: "Kết quả xử lý đang được phản đối",
  CLOSED: "Sự cố phương tiện đã được đóng",
  REOPEN_REQUESTED: "Chủ hàng yêu cầu mở lại sự cố",
  REOPEN_APPROVED: "Nhà xe đã đồng ý mở lại sự cố",
  REOPEN_REJECTED_BY_CARRIER: "Nhà xe đã từ chối mở lại sự cố",
  REOPEN_ESCALATED_TO_ADMIN: "Yêu cầu mở lại đã chuyển quản trị COLDI",
  ADMIN_REOPEN_APPROVED: "Quản trị COLDI đã đồng ý mở lại sự cố",
  ADMIN_REOPEN_REJECTED: "Quản trị COLDI đã từ chối mở lại sự cố",
};

const timeoutNote = "Nhà xe chưa phản hồi trong 48 giờ kể từ lúc chủ hàng gửi yêu cầu.";
const carrierRejectedNote = "Nhà xe từ chối. Yêu cầu chuyển quản trị COLDI xem xét.";

export function correlationFrom(header: unknown): string {
  return readCorrelationId(header) ?? `inc-${randomUUID()}`;
}

export async function createIncident(
  actor: Actor,
  draft: {
    shipmentId: string;
    incidentType: IncidentType;
    title: string;
    description: string;
    occurredAt: Date | null;
    idempotencyKey: string;
    evidenceIds?: string[];
  },
  correlationId: string,
): Promise<{ incident: IncidentView; created: boolean }> {
  const replay = await Incident.findOne({ reporterId: actor.id, idempotencyKey: draft.idempotencyKey }).lean<StoredIncident | null>();
  if (replay) {
    const view = await presentAuthorized(actor, replay);
    await repairIncident(replay._id.toString());
    return { incident: view, created: false };
  }

  const shipment = await loadShipment(draft.shipmentId);
  if (!shipment) throw new HttpError(404, "not_found", "Không tìm thấy chuyến này.");
  const decision = createDecision(actor, shipment);
  if (decision === "hidden") throw new HttpError(404, "not_found", "Không tìm thấy chuyến này.");
  if (decision === "window") {
    throw new HttpError(409, "incident_report_window", "Chưa có chính sách cho phép báo sự cố ở trạng thái chuyến này.");
  }
  if (actor.role !== "SHIPPER" && actor.role !== "CARRIER" && actor.role !== "DRIVER") {
    throw new HttpError(404, "not_found", "Không tìm thấy chuyến này.");
  }

  const reportedAt = new Date();
  let stored: StoredIncident;
  try {
    const created = await Incident.create({
      shipmentId: shipment.id,
      shipperId: shipment.shipperId,
      incidentType: draft.incidentType,
      title: draft.title,
      description: draft.description,
      ...(draft.occurredAt ? { occurredAt: draft.occurredAt } : {}),
      reportedAt,
      reporterId: actor.id,
      reporterRole: actor.role,
      ...(shipment.carrierId ? { carrierId: shipment.carrierId } : {}),
      handlerId: null,
      status: initialIncidentStatus,
      escalationStatus: initialEscalationStatus,
      priority: null,
      attachments: [],
      version: 1,
      idempotencyKey: draft.idempotencyKey,
      appliedKeys: [],
    });
    stored = created.toObject() as StoredIncident;
    const evidenceIds = draft.evidenceIds ?? [];
    if (evidenceIds.length > 0) {
      try {
        stored.attachments = await attachIncidentEvidence(actor.id, created._id, evidenceIds);
        await Incident.updateOne({ _id: created._id }, { $set: { attachments: stored.attachments } });
      } catch (attachError) {
        await Incident.deleteOne({ _id: created._id });
        throw attachError;
      }
    }
  } catch (error) {
    if (!isDuplicate(error)) throw error;
    const winner = await Incident.findOne({ reporterId: actor.id, idempotencyKey: draft.idempotencyKey }).lean<StoredIncident | null>();
    if (!winner) throw error;
    await repairIncident(winner._id.toString());
    return { incident: await presentAuthorized(actor, winner), created: false };
  }

  const event = await ensureEvent({
    incident: stored,
    action: "CREATED",
    actor,
    statusBefore: initialIncidentStatus,
    statusAfter: initialIncidentStatus,
    note: draft.title,
    idempotencyKey: `create:${draft.idempotencyKey}`,
    correlationId,
  });
  if (!event) throw new HttpError(500, "incident_audit_incomplete", "Sự cố đã được lưu nhưng lịch sử chưa ghi xong. Hãy gửi lại cùng mã idempotency.");
  await notify(stored, event, shipment, actor.id);
  return { incident: toIncidentView(stored, shipment, actor), created: true };
}

export async function acknowledgeIncident(actor: Actor, incidentId: string, expectedVersion: number, idempotencyKey: string, correlationId: string) {
  return transition(actor, incidentId, expectedVersion, idempotencyKey, correlationId, "ACKNOWLEDGE", null);
}

export async function startInvestigation(actor: Actor, incidentId: string, expectedVersion: number, idempotencyKey: string, correlationId: string, note: string) {
  return transition(actor, incidentId, expectedVersion, idempotencyKey, correlationId, "START", note);
}

export async function resolveIncident(
  actor: Actor,
  incidentId: string,
  expectedVersion: number,
  idempotencyKey: string,
  correlationId: string,
  note: string,
  evidenceIds: string[] = [],
) {
  return transition(actor, incidentId, expectedVersion, idempotencyKey, correlationId, "RESOLVE", note, evidenceIds);
}

export async function objectToResolution(actor: Actor, incidentId: string, expectedVersion: number, idempotencyKey: string, correlationId: string, note: string) {
  return transition(actor, incidentId, expectedVersion, idempotencyKey, correlationId, "OBJECT", note);
}

export async function addIncidentComment(actor: Actor, incidentId: string, expectedVersion: number, idempotencyKey: string, correlationId: string, note: string) {
  return transition(actor, incidentId, expectedVersion, idempotencyKey, correlationId, "COMMENT", note);
}

export type ClosureKind = "CLOSE" | ReopenAction;

type ClosureRequest = {
  actor: Actor;
  incidentId: string;
  expectedVersion: number;
  idempotencyKey: string;
  correlationId: string;
  note: unknown;
  now?: Date;
};

export function closeIncident(input: ClosureRequest): Promise<IncidentView> {
  return closureMutation("CLOSE", input);
}

export function requestIncidentReopen(input: ClosureRequest): Promise<IncidentView> {
  return closureMutation("REQUEST", input);
}

export function carrierRespondReopen(input: ClosureRequest & { approve: boolean }): Promise<IncidentView> {
  return closureMutation(input.approve ? "CARRIER_APPROVE" : "CARRIER_REJECT", input);
}

export function adminDecideReopen(input: ClosureRequest & { approve: boolean }): Promise<IncidentView> {
  return closureMutation(input.approve ? "ADMIN_APPROVE" : "ADMIN_REJECT", input);
}

const reopenStatusFilter = (status: ReopenStatus) => (status === "NONE" ? { $in: ["NONE", null] } : status);

async function closureMutation(kind: ClosureKind, input: ClosureRequest): Promise<IncidentView> {
  const { actor, idempotencyKey, correlationId } = input;
  const now = input.now ?? new Date();
  let current = await requireVisible(actor, input.incidentId);
  if (current.appliedKeys?.includes(idempotencyKey)) {
    await repairIncident(current._id.toString());
    return presentAuthorized(actor, current, now);
  }
  if (await escalateIfOverdue(current, now)) {
    if (kind === "CARRIER_APPROVE" || kind === "CARRIER_REJECT") {
      throw new HttpError(409, "reopen_window_expired", "Đã quá 48 giờ. Yêu cầu đã chuyển quản trị COLDI.");
    }
    current = await requireVisible(actor, input.incidentId);
  }
  const shipment = await loadShipment(current.shipmentId.toString());
  if (!shipment) throw new HttpError(404, "not_found", "Không tìm thấy sự cố này.");

  const access = accessOf(current);
  const reopenStatus = current.reopenStatus ?? "NONE";
  let statusAfter: IncidentStatus;
  let reopenAfter: ReopenStatus;
  if (kind === "CLOSE") {
    const result = closeTransition(current.status, current.incidentType);
    if (!result.ok && result.code === "incident_close_denied") {
      throw new HttpError(403, "incident_close_denied", "Chỉ sự cố phương tiện có chính sách đóng. Loại sự cố này chưa được đóng.");
    }
    if (!canClose(actor, { ...access, status: "RESOLVED" }, shipment)) {
      throw new HttpError(403, "incident_forbidden", "Chỉ nhà xe đang nhận chuyến này được đóng sự cố phương tiện.");
    }
    if (!result.ok) throw new HttpError(409, result.code, "Chỉ đóng được sự cố đã có kết quả xử lý.");
    statusAfter = result.to;
    reopenAfter = "NONE";
  } else {
    const result = reopenTransition(kind, current.incidentType, current.status, reopenStatus);
    if (!result.ok && result.code === "incident_reopen_denied") {
      throw new HttpError(403, "incident_reopen_denied", "Chỉ sự cố phương tiện có chính sách mở lại.");
    }
    assertClosureActor(kind, actor, access, shipment);
    if ((kind === "CARRIER_APPROVE" || kind === "CARRIER_REJECT") && !carrierWindowOpen(access, now)) {
      throw new HttpError(409, "reopen_window_expired", "Đã quá 48 giờ. Yêu cầu đã chuyển quản trị COLDI.");
    }
    if (!result.ok) throw new HttpError(409, "invalid_reopen", reopenConflictMessage(kind, current, now));
    statusAfter = result.statusTo;
    reopenAfter = result.reopenTo;
  }

  const note = closureNote(kind, input.note);
  if ((current.appliedKeys?.length ?? 0) >= appliedKeyLimit) {
    throw new HttpError(409, "incident_history_limit", "Sự cố đã đạt giới hạn kỹ thuật của số lần cập nhật.");
  }

  const set: Record<string, unknown> = { status: statusAfter, reopenStatus: reopenAfter };
  const unset: Record<string, ""> = {};
  const events: PendingEvent[] = [];
  const base = { actorId: actor.id, actorRole: actor.role, statusBefore: current.status, statusAfter, occurredAt: now, correlationId };
  if (kind === "CLOSE") {
    Object.assign(set, { closedAt: now, closedBy: actor.id, closeReason: note, reopenRequestId: null, reopenEscalationCause: null });
    for (const field of reopenRoundFields) unset[field] = "";
    events.push({ ...base, idempotencyKey, action: "CLOSED", ...(note ? { note } : {}) });
  } else if (kind === "REQUEST") {
    Object.assign(set, {
      reopenRequestId: randomUUID(),
      reopenRequestedAt: now,
      reopenRequestedBy: actor.id,
      reopenReason: note,
      reopenCarrierDeadlineAt: reopenDeadline(now, reopenCarrierWindowMs),
    });
    events.push({ ...base, idempotencyKey, action: "REOPEN_REQUESTED", ...(note ? { note } : {}) });
  } else if (kind === "CARRIER_APPROVE") {
    Object.assign(set, { reopenCarrierRespondedAt: now, reopenCarrierRespondedBy: actor.id, reopenCarrierNote: note });
    events.push({ ...base, idempotencyKey, action: "REOPEN_APPROVED", ...(note ? { note } : {}) });
  } else if (kind === "CARRIER_REJECT") {
    Object.assign(set, {
      reopenCarrierRespondedAt: now,
      reopenCarrierRespondedBy: actor.id,
      reopenCarrierNote: note,
      reopenEscalatedAt: now,
      reopenEscalationCause: "CARRIER_REJECTED",
    });
    events.push({ ...base, idempotencyKey, action: "REOPEN_REJECTED_BY_CARRIER", ...(note ? { note } : {}) });
    events.push({
      ...base,
      actorId: null,
      actorRole: "SYSTEM",
      idempotencyKey: `${idempotencyKey}:escalate`,
      action: "REOPEN_ESCALATED_TO_ADMIN",
      note: carrierRejectedNote,
    });
  } else {
    Object.assign(set, { reopenAdminDecidedAt: now, reopenAdminDecidedBy: actor.id, reopenAdminReason: note });
    events.push({ ...base, idempotencyKey, action: kind === "ADMIN_APPROVE" ? "ADMIN_REOPEN_APPROVED" : "ADMIN_REOPEN_REJECTED", ...(note ? { note } : {}) });
  }

  const filter: Record<string, unknown> = {
    _id: current._id,
    version: input.expectedVersion,
    status: current.status,
    reopenStatus: reopenStatusFilter(reopenStatus),
    appliedKeys: { $ne: idempotencyKey },
  };
  if (kind === "CARRIER_APPROVE" || kind === "CARRIER_REJECT") {
    filter.reopenRequestId = current.reopenRequestId;
    filter.reopenCarrierDeadlineAt = { $gt: now };
  }
  const update: Record<string, unknown> = {
    $set: set,
    $inc: { version: 1 },
    $addToSet: { appliedKeys: idempotencyKey },
    $push: { pendingEvents: { $each: events } },
  };
  if (Object.keys(unset).length > 0) update.$unset = unset;

  const updated = await Incident.findOneAndUpdate(filter, update, { returnDocument: "after" }).lean<StoredIncident | null>();
  if (!updated) {
    const raced = await Incident.findById(current._id).lean<StoredIncident | null>();
    if (raced?.appliedKeys?.includes(idempotencyKey)) {
      await repairIncident(raced._id.toString());
      return presentAuthorized(actor, raced, now);
    }
    if (raced && (kind === "CARRIER_APPROVE" || kind === "CARRIER_REJECT") && raced.reopenStatus === "AWAITING_ADMIN") {
      throw new HttpError(409, "reopen_window_expired", "Đã quá 48 giờ. Yêu cầu đã chuyển quản trị COLDI.");
    }
    throw new HttpError(409, "version_conflict", "Sự cố vừa được cập nhật. Hãy tải lại rồi thử lại.");
  }

  const complete = await flushPending(
    updated,
    events.map((event) => event.idempotencyKey),
    shipment,
  );
  if (!complete) throw new HttpError(500, "incident_audit_incomplete", "Cập nhật đã lưu nhưng lịch sử chưa ghi xong. Hãy gửi lại cùng mã idempotency.");
  return toIncidentView(updated, shipment, actor, now);
}

const reopenRoundFields = [
  "reopenRequestedAt",
  "reopenRequestedBy",
  "reopenReason",
  "reopenCarrierDeadlineAt",
  "reopenCarrierRespondedAt",
  "reopenCarrierRespondedBy",
  "reopenCarrierNote",
  "reopenEscalatedAt",
  "reopenAdminDecidedAt",
  "reopenAdminDecidedBy",
  "reopenAdminReason",
] as const;

function assertClosureActor(kind: ReopenAction, actor: Actor, access: IncidentAccess, shipment: ShipmentContext): void {
  const pretend = (reopenStatus: ReopenStatus): IncidentAccess => ({ ...access, status: "CLOSED", reopenStatus, reopenCarrierDeadlineAt: new Date(8.64e15) });
  const allowed =
    kind === "REQUEST"
      ? canRequestReopen(actor, pretend("NONE"), shipment)
      : kind === "CARRIER_APPROVE" || kind === "CARRIER_REJECT"
        ? canRespondReopen(actor, pretend("PENDING_CARRIER"), shipment, new Date(0))
        : canAdjudicateReopen(actor, pretend("AWAITING_ADMIN"));
  if (allowed) return;
  const message =
    kind === "REQUEST"
      ? "Chỉ chủ hàng của chuyến này được yêu cầu mở lại."
      : kind === "CARRIER_APPROVE" || kind === "CARRIER_REJECT"
        ? "Chỉ nhà xe đang nhận chuyến này được phản hồi yêu cầu mở lại."
        : "Chỉ quản trị COLDI được phân công cho sự cố này được quyết định.";
  throw new HttpError(403, "incident_forbidden", message);
}

function reopenConflictMessage(kind: ReopenAction, incident: StoredIncident, now: Date): string {
  if (incident.status !== "CLOSED") return "Chỉ yêu cầu mở lại được khi sự cố đã đóng.";
  const status = incident.reopenStatus ?? "NONE";
  if (kind === "REQUEST" && status === "REJECTED_BY_ADMIN") return "Quản trị COLDI đã từ chối mở lại lần đóng này.";
  if (kind === "REQUEST") return "Đã có yêu cầu mở lại đang chờ xử lý.";
  if ((kind === "CARRIER_APPROVE" || kind === "CARRIER_REJECT") && status === "AWAITING_ADMIN") {
    return incident.reopenEscalationCause === "CARRIER_TIMEOUT" || !carrierWindowOpen(accessOf(incident), now)
      ? "Đã quá 48 giờ. Yêu cầu đã chuyển quản trị COLDI."
      : "Yêu cầu đã chuyển quản trị COLDI.";
  }
  return "Không có yêu cầu mở lại ở bước này.";
}

function closureNote(kind: ClosureKind, value: unknown): string | null {
  const optional = kind === "CARRIER_APPROVE";
  const text = typeof value === "string" ? value.trim().replaceAll("\u0000", "") : "";
  if (optional && text === "") return null;
  const [min, max, label] =
    kind === "CLOSE"
      ? [incidentLimits.closeReasonMin, incidentLimits.closeReasonMax, "Lý do đóng hoặc mã kết quả xử lý"]
      : kind === "REQUEST"
        ? [incidentLimits.reopenReasonMin, incidentLimits.reopenReasonMax, "Lý do yêu cầu mở lại"]
        : kind === "CARRIER_APPROVE"
          ? [1, incidentLimits.reopenResponseMax, "Ghi chú của nhà xe"]
          : kind === "CARRIER_REJECT"
            ? [incidentLimits.reopenReasonMin, incidentLimits.reopenResponseMax, "Lý do từ chối"]
            : [incidentLimits.reopenReasonMin, incidentLimits.reopenResponseMax, "Lý do quyết định"];
  if (typeof value !== "string" || text.length < min || text.length > max) {
    const field = kind === "CLOSE" ? "closeReason" : "reason";
    throw new HttpError(400, "invalid_request", `${label} cần từ ${min} đến ${max} ký tự.`, { [field]: `${label} cần từ ${min} đến ${max} ký tự.` });
  }
  return text;
}

/**
 * Refers one overdue reopen request to COLDI Admin. The deadline and request id are persisted,
 * so a restart or a second worker repeats the same conditional update and only one write wins.
 */
async function escalateIfOverdue(incident: StoredIncident, now: Date): Promise<boolean> {
  if (incident.reopenStatus !== "PENDING_CARRIER" || !incident.reopenRequestId || !incident.reopenCarrierDeadlineAt) return false;
  if (incident.reopenCarrierDeadlineAt.getTime() > now.getTime()) return false;
  const key = `reopen-timeout:${incident.reopenRequestId}`;
  const event: PendingEvent = {
    idempotencyKey: key,
    action: "REOPEN_ESCALATED_TO_ADMIN",
    actorId: null,
    actorRole: "SYSTEM",
    statusBefore: incident.status,
    statusAfter: incident.status,
    note: timeoutNote,
    occurredAt: now,
    correlationId: `reopen-timeout-${incident.reopenRequestId}`.slice(0, 80),
  };
  const updated = await Incident.findOneAndUpdate(
    {
      _id: incident._id,
      reopenStatus: "PENDING_CARRIER",
      reopenRequestId: incident.reopenRequestId,
      reopenCarrierDeadlineAt: { $lte: now },
      appliedKeys: { $ne: key },
    },
    {
      $set: { reopenStatus: "AWAITING_ADMIN", reopenEscalatedAt: now, reopenEscalationCause: "CARRIER_TIMEOUT" },
      $inc: { version: 1 },
      $addToSet: { appliedKeys: key },
      $push: { pendingEvents: event },
    },
    { returnDocument: "after" },
  ).lean<StoredIncident | null>();
  const target = updated ?? (await Incident.findById(incident._id).lean<StoredIncident | null>());
  if (!target?.appliedKeys?.includes(key)) return false;
  await flushPending(target, [key], await loadShipment(target.shipmentId.toString()));
  return updated !== null;
}

export async function escalateOverdueReopenRequests(now = new Date(), limit = 50): Promise<number> {
  const rows = await Incident.find({ reopenStatus: "PENDING_CARRIER", reopenCarrierDeadlineAt: { $lte: now } })
    .sort({ reopenCarrierDeadlineAt: 1 })
    .limit(limit)
    .lean<StoredIncident[]>();
  let escalated = 0;
  for (const row of rows) {
    if (await escalateIfOverdue(row, now)) escalated += 1;
  }
  return escalated;
}

/** Runs on startup and then on an interval. The deadline lives in MongoDB, not in this timer. */
export function startReopenEscalationSweeper(intervalMs = 60_000): () => void {
  let running = false;
  const run = async () => {
    if (running) return;
    running = true;
    try {
      await escalateOverdueReopenRequests(new Date());
    } catch (error) {
      console.error("Incident reopen escalation did not finish.", error instanceof Error ? error.name : "error");
    } finally {
      running = false;
    }
  };
  void run();
  const timer = setInterval(() => void run(), intervalMs);
  timer.unref();
  return () => clearInterval(timer);
}

export async function getAuthorizedIncident(actor: Actor, incidentId: string): Promise<{ incident: IncidentView; events: IncidentEventView[] }> {
  let stored = await requireVisible(actor, incidentId);
  if (await escalateIfOverdue(stored, new Date())) stored = await requireVisible(actor, incidentId);
  await repairIncident(stored._id.toString());
  const shipment = await loadShipment(stored.shipmentId.toString());
  if (!shipment || caseScope(actor, accessOf(stored), shipment) === "none") {
    throw new HttpError(404, "not_found", "Không tìm thấy sự cố này.");
  }
  return { incident: toIncidentView(stored, shipment, actor, new Date()), events: await visibleEvents(stored._id.toString()) };
}

export async function listAuthorizedIncidents(
  actor: Actor,
  input: { limit: number; cursor: string | undefined; shipmentId: string | undefined; status: string | undefined },
): Promise<{ incidents: IncidentView[]; nextCursor: string | null }> {
  const auth = await listFilter(actor);
  if (!auth) return { incidents: [], nextCursor: null };
  if (input.shipmentId !== undefined && !isValidObjectId(input.shipmentId)) {
    throw new HttpError(400, "invalid_request", "Mã chuyến không hợp lệ.", { shipmentId: "Mã chuyến không hợp lệ." });
  }
  if (input.status !== undefined && !incidentStatuses.includes(input.status as IncidentStatus)) {
    throw new HttpError(400, "invalid_request", "Trạng thái không hợp lệ.", { status: "Trạng thái không hợp lệ." });
  }
  const cursor = decodeCursor(input.cursor);
  if (input.cursor && !cursor) throw new HttpError(400, "invalid_request", "Con trỏ trang không hợp lệ.");
  const clauses: Record<string, unknown>[] = [auth];
  if (input.shipmentId) clauses.push({ shipmentId: input.shipmentId });
  if (input.status) clauses.push({ status: input.status });
  if (cursor) {
    const updatedAt = new Date(cursor.u);
    clauses.push({ $or: [{ updatedAt: { $lt: updatedAt } }, { updatedAt, _id: { $lt: cursor.i } }] });
  }
  const limit = input.limit || pageDefault;
  const now = new Date();
  const rows = await Incident.find({ $and: clauses }).sort({ updatedAt: -1, _id: -1 }).limit(limit + 1).lean<StoredIncident[]>();
  const page = rows.slice(0, limit);
  const last = page.at(-1);
  const incidents: IncidentView[] = [];
  for (const row of page) {
    const current = (await escalateIfOverdue(row, now)) ? ((await Incident.findById(row._id).lean<StoredIncident | null>()) ?? row) : row;
    const shipment = await loadShipment(current.shipmentId.toString());
    if (!shipment || caseScope(actor, accessOf(current), shipment) === "none") continue;
    incidents.push(toIncidentView(current, shipment, actor, now));
  }
  return {
    incidents,
    nextCursor: rows.length > limit && last ? encodeCursor(last.updatedAt, last._id.toString()) : null,
  };
}

export async function listNotifications(actor: Actor, limit: number): Promise<NotificationView[]> {
  const rows = await IncidentNotification.find({ recipientId: actor.id }).sort({ createdAt: -1, _id: -1 }).limit(limit).lean<NotificationSource[]>();
  return rows.map((row) => toNotificationView(row));
}

export async function unreadNotificationCount(actor: Actor): Promise<number> {
  return IncidentNotification.countDocuments({ recipientId: actor.id, readAt: null });
}

export async function markNotificationRead(actor: Actor, notificationId: string): Promise<NotificationView> {
  if (!isValidObjectId(notificationId)) throw new HttpError(404, "not_found", "Không tìm thấy thông báo này.");
  const existing = await IncidentNotification.findOne({ _id: notificationId, recipientId: actor.id }).lean<NotificationSource | null>();
  if (!existing) throw new HttpError(404, "not_found", "Không tìm thấy thông báo này.");
  await requireVisible(actor, existing.incidentId.toString());
  if (existing.readAt) return toNotificationView(existing);
  const updated = await IncidentNotification.findOneAndUpdate(
    { _id: notificationId, recipientId: actor.id, readAt: null },
    { $set: { readAt: new Date() } },
    { returnDocument: "after" },
  ).lean<NotificationSource | null>();
  return toNotificationView(updated ?? existing);
}

export async function reconcileIncidentArtifacts(limit = 100): Promise<number> {
  const rows = await Incident.find().sort({ updatedAt: -1 }).limit(limit).select("_id").lean<{ _id: Id }[]>();
  for (const row of rows) {
    await repairIncident(row._id.toString());
  }
  return rows.length;
}

async function transition(
  actor: Actor,
  incidentId: string,
  expectedVersion: number,
  idempotencyKey: string,
  correlationId: string,
  kind: PrimaryAction | "COMMENT",
  note: string | null,
  evidenceIds: string[] = [],
): Promise<IncidentView> {
  const current = await requireVisible(actor, incidentId);
  if (kind === "RESOLVE") await releaseAbandonedResolutionClaims(current._id);
  if (current.appliedKeys?.includes(idempotencyKey)) {
    await ensureAppliedEvent(current, actor, kind, note, idempotencyKey, correlationId);
    await repairIncident(current._id.toString());
    if (kind === "RESOLVE") {
      const evidenceIds = storedEvidenceIds(current, idempotencyKey);
      await ensureResolutionEvidenceBound(actor.id, current._id, idempotencyKey, evidenceIds);
      await assertResolutionEvidenceHeld(current._id, idempotencyKey, evidenceIds);
    }
    return presentAuthorized(actor, current);
  }
  const shipment = await loadShipment(current.shipmentId.toString());
  if (!shipment) throw new HttpError(404, "not_found", "Không tìm thấy sự cố này.");
  const action = assertMutation(actor, current, shipment, kind);
  const next = action.statusAfter;
  if ((current.appliedKeys?.length ?? 0) >= appliedKeyLimit) {
    throw new HttpError(409, "incident_history_limit", "Sự cố đã đạt giới hạn kỹ thuật của số lần cập nhật.");
  }
  if (kind === "RESOLVE" && evidenceIds.length > 0) {
    await claimResolutionEvidence(actor.id, current._id, idempotencyKey, evidenceIds);
  }

  const set: Record<string, unknown> = {};
  if (kind !== "COMMENT") set.status = next;
  if (kind === "RESOLVE") {
    set.resolutionSummary = note;
    set.resolvedAt = new Date();
    set.resolvedBy = actor.id;
  }
  if (kind === "OBJECT") {
    set.objectionReason = note;
    set.objectedAt = new Date();
    set.objectedBy = actor.id;
  }
  const update: Record<string, unknown> = {
    $inc: { version: 1 },
    $addToSet: { appliedKeys: idempotencyKey },
    $push: {
      pendingEvents: {
        idempotencyKey,
        action: action.event,
        actorId: actor.id,
        actorRole: actor.role,
        statusBefore: current.status,
        statusAfter: next,
        correlationId,
        ...(note ? { note } : {}),
        ...(kind === "RESOLVE" ? { evidenceIds } : {}),
      },
    },
  };
  if (Object.keys(set).length > 0) update.$set = set;

  let updated: StoredIncident | null;
  try {
    updated = await Incident.findOneAndUpdate(
      { _id: current._id, version: expectedVersion, status: current.status, appliedKeys: { $ne: idempotencyKey } },
      update,
      { returnDocument: "after" },
    ).lean<StoredIncident | null>();
  } catch (error) {
    if (kind === "RESOLVE") await releaseResolutionClaim(actor.id, current._id, idempotencyKey);
    throw error;
  }

  if (!updated) {
    const raced = await Incident.findById(current._id).lean<StoredIncident | null>();
    if (raced?.appliedKeys?.includes(idempotencyKey)) {
      await ensureAppliedEvent(raced, actor, kind, note, idempotencyKey, correlationId);
      await repairIncident(raced._id.toString());
      if (kind === "RESOLVE") {
        const evidenceIds = storedEvidenceIds(raced, idempotencyKey);
        await ensureResolutionEvidenceBound(actor.id, raced._id, idempotencyKey, evidenceIds);
        await assertResolutionEvidenceHeld(raced._id, idempotencyKey, evidenceIds);
      }
      return presentAuthorized(actor, raced);
    }
    if (kind === "RESOLVE") await releaseResolutionClaim(actor.id, current._id, idempotencyKey);
    throw new HttpError(409, "version_conflict", "Sự cố vừa được cập nhật. Hãy tải lại rồi thử lại.");
  }

  const event = await ensureEvent({
    incident: updated,
    action: action.event,
    actor,
    statusBefore: current.status,
    statusAfter: updated.status,
    ...(note ? { note } : {}),
    ...(kind === "RESOLVE" && evidenceIds.length > 0 ? { evidenceIds } : {}),
    idempotencyKey,
    correlationId,
  });
  if (!event) throw new HttpError(500, "incident_audit_incomplete", "Cập nhật đã lưu nhưng lịch sử chưa ghi xong. Hãy gửi lại cùng mã idempotency.");
  if (kind === "RESOLVE") {
    await ensureResolutionEvidenceBound(actor.id, updated._id, idempotencyKey, evidenceIds);
    await assertResolutionEvidenceHeld(updated._id, idempotencyKey, evidenceIds);
  }
  await notify(updated, event, shipment, actor.id);
  return toIncidentView(updated, shipment, actor);
}

function storedEvidenceIds(incident: StoredIncident, idempotencyKey: string): string[] {
  return incident.pendingEvents?.find((item) => item.idempotencyKey === idempotencyKey)?.evidenceIds ?? [];
}

async function ensureAppliedEvent(
  incident: StoredIncident,
  actor: Actor,
  kind: PrimaryAction | "COMMENT",
  note: string | null,
  idempotencyKey: string,
  correlationId: string,
): Promise<void> {
  const mapped =
    kind === "COMMENT"
      ? { event: "COMMENT" as const, from: incident.status, to: incident.status }
      : kind === "ACKNOWLEDGE"
        ? { event: "ACKNOWLEDGED" as const, from: "OPEN" as const, to: "ACKNOWLEDGED" as const }
        : kind === "START"
          ? { event: "INVESTIGATION_STARTED" as const, from: "ACKNOWLEDGED" as const, to: "IN_PROGRESS" as const }
          : kind === "RESOLVE"
            ? { event: "RESOLVED" as const, from: "IN_PROGRESS" as const, to: "RESOLVED" as const }
            : { event: "OBJECTED" as const, from: "RESOLVED" as const, to: "IN_PROGRESS" as const };
  const evidenceIds = incident.pendingEvents?.find((item) => item.idempotencyKey === idempotencyKey)?.evidenceIds ?? [];
  const event = await ensureEvent({
    incident,
    action: mapped.event,
    actor,
    statusBefore: mapped.from,
    statusAfter: mapped.to,
    ...(note ? { note } : {}),
    ...(evidenceIds.length > 0 ? { evidenceIds } : {}),
    idempotencyKey,
    correlationId,
  });
  if (!event) throw new HttpError(500, "incident_audit_incomplete", "Cập nhật đã lưu nhưng lịch sử chưa ghi xong. Hãy gửi lại cùng mã idempotency.");
}

function assertMutation(
  actor: Actor,
  incident: StoredIncident,
  shipment: ShipmentContext,
  kind: PrimaryAction | "COMMENT",
): { event: IncidentAction; statusAfter: IncidentStatus } {
  const scope = caseScope(actor, accessOf(incident), shipment);
  if (kind === "COMMENT") {
    if (!canComment(actor, scope, incident.status)) {
      throw new HttpError(incident.status === "CLOSED" ? 409 : 403, incident.status === "CLOSED" ? "incident_closed" : "incident_forbidden", "Bạn không được cập nhật sự cố này.");
    }
    return { event: "COMMENT", statusAfter: incident.status };
  }
  const transitionResult = primaryTransition(kind, incident.status);
  if (!transitionResult.ok) {
    throw new HttpError(409, transitionResult.code, transitionResult.code === "incident_closed" ? "Sự cố đã đóng và chưa có chính sách mở lại." : "Thao tác không đúng trạng thái hiện tại.");
  }
  const allowed =
    (kind === "OBJECT" && canObject(actor, accessOf(incident), shipment)) ||
    (kind !== "OBJECT" && isCarrierHandler(actor, shipment) && scope === "handler");
  if (!allowed) throw new HttpError(403, "incident_forbidden", "Bạn không được thực hiện thao tác này.");
  const event: IncidentAction =
    kind === "ACKNOWLEDGE" ? "ACKNOWLEDGED" : kind === "START" ? "INVESTIGATION_STARTED" : kind === "RESOLVE" ? "RESOLVED" : "OBJECTED";
  return { event, statusAfter: transitionResult.to };
}

async function requireVisible(actor: Actor, incidentId: string): Promise<StoredIncident> {
  if (!isValidObjectId(incidentId)) throw new HttpError(404, "not_found", "Không tìm thấy sự cố này.");
  const incident = await Incident.findById(incidentId).lean<StoredIncident | null>();
  if (!incident) throw new HttpError(404, "not_found", "Không tìm thấy sự cố này.");
  const shipment = await loadShipment(incident.shipmentId.toString());
  if (!shipment || caseScope(actor, accessOf(incident), shipment) === "none") {
    throw new HttpError(404, "not_found", "Không tìm thấy sự cố này.");
  }
  return incident;
}

async function presentAuthorized(actor: Actor, incident: StoredIncident, now = new Date()): Promise<IncidentView> {
  const shipment = await loadShipment(incident.shipmentId.toString());
  if (!shipment || caseScope(actor, accessOf(incident), shipment) === "none") {
    throw new HttpError(404, "not_found", "Không tìm thấy sự cố này.");
  }
  return toIncidentView(incident, shipment, actor, now);
}

async function repairIncident(incidentId: string): Promise<void> {
  const incident = await Incident.findById(incidentId).lean<StoredIncident | null>();
  if (!incident) return;
  await releaseAbandonedResolutionClaims(incident._id);
  const shipment = await loadShipment(incident.shipmentId.toString());
  await ensureEvent({
    incident,
    action: "CREATED",
    actor: { id: incident.reporterId.toString(), role: incident.reporterRole },
    statusBefore: initialIncidentStatus,
    statusAfter: initialIncidentStatus,
    note: incident.title,
    idempotencyKey: `create:${incident.idempotencyKey}`,
    correlationId: `repair-${incident._id.toString()}`,
  });
  for (const pending of incident.pendingEvents ?? []) {
    if (pending.action === "RESOLVED" && pending.actorId && pending.evidenceIds && pending.evidenceIds.length > 0) {
      await ensureResolutionEvidenceBound(pending.actorId.toString(), incident._id, pending.idempotencyKey, pending.evidenceIds);
    }
    await ensurePendingEvent(incident, pending);
  }
  if (!shipment) return;
  const events = await IncidentEvent.find({ incidentId: incident._id }).limit(appliedKeyLimit * 2).lean<StoredEvent[]>();
  for (const event of events) {
    await notify(incident, event, shipment, event.actorId ? event.actorId.toString() : null);
  }
}

function ensurePendingEvent(incident: StoredIncident, pending: PendingEvent): Promise<StoredEvent | null> {
  return ensureEvent({
    incident,
    action: pending.action,
    actor: { id: pending.actorId ? pending.actorId.toString() : null, role: pending.actorRole },
    statusBefore: pending.statusBefore,
    statusAfter: pending.statusAfter,
    ...(pending.note ? { note: pending.note } : {}),
    ...(pending.occurredAt ? { occurredAt: pending.occurredAt } : {}),
    ...(pending.evidenceIds && pending.evidenceIds.length > 0 ? { evidenceIds: pending.evidenceIds } : {}),
    idempotencyKey: pending.idempotencyKey,
    correlationId: pending.correlationId,
  });
}

/** Writes the pending events with these keys, then notifies each. Returns false when an event could not be stored. */
async function flushPending(incident: StoredIncident, keys: readonly string[], shipment: ShipmentContext | null): Promise<boolean> {
  let complete = true;
  for (const pending of incident.pendingEvents ?? []) {
    if (!keys.includes(pending.idempotencyKey)) continue;
    const event = await ensurePendingEvent(incident, pending);
    if (!event) {
      complete = false;
      continue;
    }
    if (shipment) await notify(incident, event, shipment, event.actorId ? event.actorId.toString() : null);
  }
  return complete;
}

async function ensureEvent(input: {
  incident: StoredIncident;
  action: IncidentAction;
  actor: EventActor;
  statusBefore: IncidentStatus;
  statusAfter: IncidentStatus;
  note?: string;
  evidenceIds?: string[];
  occurredAt?: Date;
  idempotencyKey: string;
  correlationId: string;
}): Promise<StoredEvent | null> {
  const payload = {
    incidentId: input.incident._id,
    action: input.action,
    actorId: input.actor.id,
    actorRole: input.actor.role,
    occurredAt: input.occurredAt ?? new Date(),
    statusBefore: input.statusBefore,
    statusAfter: input.statusAfter,
    escalationBefore: input.incident.escalationStatus,
    escalationAfter: input.incident.escalationStatus,
    ...(input.note ? { note: input.note } : {}),
    ...(input.evidenceIds && input.evidenceIds.length > 0 ? { evidenceIds: input.evidenceIds } : {}),
    idempotencyKey: input.idempotencyKey,
    correlationId: input.correlationId,
    visibility: "PARTICIPANT" as const,
  };
  try {
    const created = await IncidentEvent.create(payload);
    return created.toObject() as StoredEvent;
  } catch (error) {
    if (!isDuplicate(error)) {
      console.error("Incident event was not stored.", error);
      return null;
    }
    const existing = await IncidentEvent.findOne({ incidentId: input.incident._id, idempotencyKey: input.idempotencyKey }).lean<StoredEvent | null>();
    if (!existing || !input.evidenceIds?.length || (existing.evidenceIds?.length ?? 0) > 0) return existing;
    const filled = await IncidentEvent.findOneAndUpdate(
      { _id: existing._id, $or: [{ evidenceIds: { $exists: false } }, { evidenceIds: { $size: 0 } }] },
      { $set: { evidenceIds: input.evidenceIds } },
      { returnDocument: "after" },
    ).lean<StoredEvent | null>();
    return filled ?? existing;
  }
}

async function notify(incident: StoredIncident, event: StoredEvent, shipment: ShipmentContext, actorId: string | null): Promise<void> {
  if (event.visibility === "INTERNAL") return;
  const recipients = recipientIds({
    actorId: actorId ?? "",
    reporterId: incident.reporterId.toString(),
    handlerId: incident.handlerId ? incident.handlerId.toString() : null,
    shipperId: shipment.shipperId,
    carrierId: shipment.carrierId,
    driverId: shipment.driverId,
  });
  await Promise.all(recipients.map((recipientId) => upsertNotification(incident, event, recipientId)));
}

async function upsertNotification(incident: StoredIncident, event: StoredEvent, recipientId: string): Promise<void> {
  try {
    await IncidentNotification.updateOne(
      { eventId: event._id, recipientId },
      {
        $setOnInsert: {
          recipientId,
          incidentId: incident._id,
          eventId: event._id,
          eventType: event.action,
          label: notificationLabels[event.action],
          readAt: null,
        },
      },
      { upsert: true },
    );
  } catch (error) {
    if (!isDuplicate(error)) console.error("Incident notification was not stored.", error);
  }
}

async function visibleEvents(incidentId: string): Promise<IncidentEventView[]> {
  const rows = await IncidentEvent.find({ incidentId, visibility: "PARTICIPANT" }).sort({ occurredAt: 1, _id: 1 }).limit(100).lean<StoredEvent[]>();
  return rows.flatMap((row) => {
    const view = toEventView(row);
    return view ? [view] : [];
  });
}

async function listFilter(actor: Actor): Promise<Record<string, unknown> | null> {
  if (actor.role === "SHIPPER") return { shipperId: actor.id };
  if (actor.role === "ADMIN") return { handlerId: actor.id };
  if (actor.role === "CARRIER") {
    const ids = await Shipment.find({ carrierId: actor.id }).select("_id").sort({ updatedAt: -1 }).limit(1000).lean<{ _id: Id }[]>();
    if (ids.length === 0) return null;
    return { shipmentId: { $in: ids.map((row) => row._id) } };
  }
  if (actor.role === "DRIVER") {
    const ids = await Shipment.find({ driverId: actor.id }).select("_id").sort({ updatedAt: -1 }).limit(1000).lean<{ _id: Id }[]>();
    const own = { reporterId: actor.id, reporterRole: "DRIVER" };
    if (ids.length === 0) return own;
    return { $or: [{ shipmentId: { $in: ids.map((row) => row._id) } }, own] };
  }
  return null;
}

async function loadShipment(id: string): Promise<ShipmentContext | null> {
  if (!isValidObjectId(id)) return null;
  const shipment = await Shipment.findById(id).select("shipperId carrierId driverId status pickupLocation deliveryLocation cargoDescription").lean<{
    _id: Id;
    shipperId: Id;
    carrierId?: Id | null;
    driverId?: Id | null;
    status: string;
    pickupLocation: string;
    deliveryLocation: string;
    cargoDescription: string;
  } | null>();
  if (!shipment) return null;
  const cargo = shipment.cargoDescription.length > 80 ? `${shipment.cargoDescription.slice(0, 80)}…` : shipment.cargoDescription;
  return {
    id: shipment._id.toString(),
    shipperId: shipment.shipperId.toString(),
    carrierId: shipment.carrierId ? shipment.carrierId.toString() : null,
    driverId: shipment.driverId ? shipment.driverId.toString() : null,
    status: shipment.status,
    label: `${shipment.pickupLocation} → ${shipment.deliveryLocation} · ${cargo}`,
  };
}

function accessOf(incident: StoredIncident): IncidentAccess {
  return {
    reporterId: incident.reporterId.toString(),
    reporterRole: incident.reporterRole,
    handlerId: incident.handlerId ? incident.handlerId.toString() : null,
    status: incident.status,
    incidentType: incident.incidentType,
    reopenStatus: incident.reopenStatus ?? "NONE",
    reopenCarrierDeadlineAt: incident.reopenCarrierDeadlineAt ?? null,
  };
}

function encodeCursor(updatedAt: Date, id: string): string {
  return Buffer.from(JSON.stringify({ u: updatedAt.toISOString(), i: id }), "utf8").toString("base64url");
}

function decodeCursor(value: string | undefined): { u: string; i: string } | null {
  if (!value) return null;
  try {
    const parsed: unknown = JSON.parse(Buffer.from(value, "base64url").toString("utf8"));
    if (typeof parsed !== "object" || parsed === null) return null;
    const record = parsed as { u?: unknown; i?: unknown };
    if (typeof record.u !== "string" || typeof record.i !== "string") return null;
    if (Number.isNaN(new Date(record.u).getTime()) || !isValidObjectId(record.i)) return null;
    return { u: record.u, i: record.i };
  } catch {
    return null;
  }
}

type NotificationSource = {
  _id: Id;
  incidentId: Id;
  eventType: IncidentAction;
  label: string;
  createdAt: Date;
  readAt?: Date | null;
};

function isDuplicate(error: unknown): boolean {
  return typeof error === "object" && error !== null && "code" in error && (error as { code: unknown }).code === 11000;
}
