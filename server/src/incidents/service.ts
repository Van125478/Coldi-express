import { randomUUID } from "node:crypto";
import { isValidObjectId, type Types } from "mongoose";
import { readCorrelationId } from "../audit/recordAudit.js";
import { HttpError } from "../middlewares/errorHandler.js";
import { Incident } from "../models/incident.js";
import { IncidentEvent } from "../models/incidentEvent.js";
import { IncidentNotification } from "../models/incidentNotification.js";
import { Shipment } from "../models/shipment.js";
import type { Actor, ShipmentAccess } from "./access.js";
import { canComment, canObject, caseScope, createDecision, isCarrierHandler, recipientIds } from "./access.js";
import { initialEscalationStatus, initialIncidentStatus, primaryTransition, type PrimaryAction } from "./lifecycle.js";
import type { EscalationStatus, IncidentAction, IncidentStatus, IncidentType } from "./policy.js";
import { appliedKeyLimit, incidentStatuses, pageDefault } from "./policy.js";
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
  idempotencyKey: string;
  appliedKeys?: string[];
  pendingEvents?: {
    idempotencyKey: string;
    action: IncidentAction;
    actorId: Id;
    actorRole: Actor["role"];
    statusBefore: IncidentStatus;
    statusAfter: IncidentStatus;
    note?: string;
    correlationId: string;
  }[];
  createdAt: Date;
  updatedAt: Date;
};

type StoredEvent = {
  _id: Id;
  incidentId: Id;
  action: IncidentAction;
  actorId: Id;
  actorRole: "SHIPPER" | "CARRIER" | "DRIVER" | "ADMIN";
  occurredAt: Date;
  statusBefore: IncidentStatus;
  statusAfter: IncidentStatus;
  escalationBefore: EscalationStatus;
  escalationAfter: EscalationStatus;
  note?: string;
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
};

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

export async function resolveIncident(actor: Actor, incidentId: string, expectedVersion: number, idempotencyKey: string, correlationId: string, note: string) {
  return transition(actor, incidentId, expectedVersion, idempotencyKey, correlationId, "RESOLVE", note);
}

export async function objectToResolution(actor: Actor, incidentId: string, expectedVersion: number, idempotencyKey: string, correlationId: string, note: string) {
  return transition(actor, incidentId, expectedVersion, idempotencyKey, correlationId, "OBJECT", note);
}

export async function addIncidentComment(actor: Actor, incidentId: string, expectedVersion: number, idempotencyKey: string, correlationId: string, note: string) {
  return transition(actor, incidentId, expectedVersion, idempotencyKey, correlationId, "COMMENT", note);
}

export async function getAuthorizedIncident(actor: Actor, incidentId: string): Promise<{ incident: IncidentView; events: IncidentEventView[] }> {
  const stored = await requireVisible(actor, incidentId);
  await repairIncident(stored._id.toString());
  const shipment = await loadShipment(stored.shipmentId.toString());
  if (!shipment || caseScope(actor, accessOf(stored), shipment) === "none") {
    throw new HttpError(404, "not_found", "Không tìm thấy sự cố này.");
  }
  return { incident: toIncidentView(stored, shipment, actor), events: await visibleEvents(stored._id.toString()) };
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
  const rows = await Incident.find({ $and: clauses }).sort({ updatedAt: -1, _id: -1 }).limit(limit + 1).lean<StoredIncident[]>();
  const page = rows.slice(0, limit);
  const last = page.at(-1);
  const incidents: IncidentView[] = [];
  for (const row of page) {
    const shipment = await loadShipment(row.shipmentId.toString());
    if (!shipment || caseScope(actor, accessOf(row), shipment) === "none") continue;
    incidents.push(toIncidentView(row, shipment, actor));
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
): Promise<IncidentView> {
  const current = await requireVisible(actor, incidentId);
  if (current.appliedKeys?.includes(idempotencyKey)) {
    await ensureAppliedEvent(current, actor, kind, note, idempotencyKey, correlationId);
    await repairIncident(current._id.toString());
    return presentAuthorized(actor, current);
  }
  const shipment = await loadShipment(current.shipmentId.toString());
  if (!shipment) throw new HttpError(404, "not_found", "Không tìm thấy sự cố này.");
  const action = assertMutation(actor, current, shipment, kind);
  const next = action.statusAfter;
  if ((current.appliedKeys?.length ?? 0) >= appliedKeyLimit) {
    throw new HttpError(409, "incident_history_limit", "Sự cố đã đạt giới hạn kỹ thuật của số lần cập nhật.");
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
      },
    },
  };
  if (Object.keys(set).length > 0) update.$set = set;

  const updated = await Incident.findOneAndUpdate(
    { _id: current._id, version: expectedVersion, status: current.status, appliedKeys: { $ne: idempotencyKey } },
    update,
    { returnDocument: "after" },
  ).lean<StoredIncident | null>();

  if (!updated) {
    const raced = await Incident.findById(current._id).lean<StoredIncident | null>();
    if (raced?.appliedKeys?.includes(idempotencyKey)) {
      await ensureAppliedEvent(raced, actor, kind, note, idempotencyKey, correlationId);
      await repairIncident(raced._id.toString());
      return presentAuthorized(actor, raced);
    }
    throw new HttpError(409, "version_conflict", "Sự cố vừa được cập nhật. Hãy tải lại rồi thử lại.");
  }

  const event = await ensureEvent({
    incident: updated,
    action: action.event,
    actor,
    statusBefore: current.status,
    statusAfter: updated.status,
    ...(note ? { note } : {}),
    idempotencyKey,
    correlationId,
  });
  if (!event) throw new HttpError(500, "incident_audit_incomplete", "Cập nhật đã lưu nhưng lịch sử chưa ghi xong. Hãy gửi lại cùng mã idempotency.");
  await notify(updated, event, shipment, actor.id);
  return toIncidentView(updated, shipment, actor);
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
  const event = await ensureEvent({
    incident,
    action: mapped.event,
    actor,
    statusBefore: mapped.from,
    statusAfter: mapped.to,
    ...(note ? { note } : {}),
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

async function presentAuthorized(actor: Actor, incident: StoredIncident): Promise<IncidentView> {
  const shipment = await loadShipment(incident.shipmentId.toString());
  if (!shipment || caseScope(actor, accessOf(incident), shipment) === "none") {
    throw new HttpError(404, "not_found", "Không tìm thấy sự cố này.");
  }
  return toIncidentView(incident, shipment, actor);
}

async function repairIncident(incidentId: string): Promise<void> {
  const incident = await Incident.findById(incidentId).lean<StoredIncident | null>();
  if (!incident) return;
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
    await ensureEvent({
      incident,
      action: pending.action,
      actor: { id: pending.actorId.toString(), role: pending.actorRole },
      statusBefore: pending.statusBefore,
      statusAfter: pending.statusAfter,
      ...(pending.note ? { note: pending.note } : {}),
      idempotencyKey: pending.idempotencyKey,
      correlationId: pending.correlationId,
    });
  }
  if (!shipment) return;
  const events = await IncidentEvent.find({ incidentId: incident._id }).limit(appliedKeyLimit).lean<StoredEvent[]>();
  for (const event of events) {
    await notify(incident, event, shipment, event.actorId.toString());
  }
}

async function ensureEvent(input: {
  incident: StoredIncident;
  action: IncidentAction;
  actor: Actor;
  statusBefore: IncidentStatus;
  statusAfter: IncidentStatus;
  note?: string;
  idempotencyKey: string;
  correlationId: string;
}): Promise<StoredEvent | null> {
  const payload = {
    incidentId: input.incident._id,
    action: input.action,
    actorId: input.actor.id,
    actorRole: input.actor.role,
    occurredAt: new Date(),
    statusBefore: input.statusBefore,
    statusAfter: input.statusAfter,
    escalationBefore: input.incident.escalationStatus,
    escalationAfter: input.incident.escalationStatus,
    ...(input.note ? { note: input.note } : {}),
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
    return IncidentEvent.findOne({ incidentId: input.incident._id, idempotencyKey: input.idempotencyKey }).lean<StoredEvent | null>();
  }
}

async function notify(incident: StoredIncident, event: StoredEvent, shipment: ShipmentContext, actorId: string): Promise<void> {
  if (event.visibility === "INTERNAL") return;
  const recipients = recipientIds({
    actorId,
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

function accessOf(incident: StoredIncident) {
  return {
    reporterId: incident.reporterId.toString(),
    reporterRole: incident.reporterRole,
    handlerId: incident.handlerId ? incident.handlerId.toString() : null,
    status: incident.status,
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
