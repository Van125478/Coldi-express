import type { Actor, ShipmentAccess } from "./access.js";
import { capabilities } from "./access.js";
import type { EscalationStatus, IncidentAction, IncidentStatus, IncidentType, ReopenEscalationCause, ReopenStatus } from "./policy.js";
import { incidentStatusLabels, incidentTypeLabels, reopenStatusLabels } from "./policy.js";

const roleLabels = {
  SHIPPER: "Chủ hàng",
  CARRIER: "Nhà xe",
  DRIVER: "Tài xế",
  ADMIN: "Quản trị",
  SYSTEM: "Hệ thống COLDI",
} as const;

const actionLabels: Record<IncidentAction, string> = {
  CREATED: "Đã tạo báo cáo",
  ACKNOWLEDGED: "Đã tiếp nhận",
  INVESTIGATION_STARTED: "Đã bắt đầu xử lý",
  COMMENT: "Đã thêm cập nhật",
  RESOLVED: "Đã gửi kết quả xử lý",
  OBJECTED: "Đã phản đối kết quả",
  CLOSED: "Đã đóng sự cố",
  REOPEN_REQUESTED: "Đã yêu cầu mở lại",
  REOPEN_APPROVED: "Nhà xe đồng ý mở lại",
  REOPEN_REJECTED_BY_CARRIER: "Nhà xe từ chối mở lại",
  REOPEN_ESCALATED_TO_ADMIN: "Đã chuyển quản trị COLDI xem xét",
  ADMIN_REOPEN_APPROVED: "Quản trị COLDI đồng ý mở lại",
  ADMIN_REOPEN_REJECTED: "Quản trị COLDI từ chối mở lại",
};

const escalationCauseLabels: Record<ReopenEscalationCause, string> = {
  CARRIER_REJECTED: "Nhà xe từ chối yêu cầu",
  CARRIER_TIMEOUT: "Nhà xe chưa phản hồi trong 48 giờ",
};

export type ReopenView = {
  status: ReopenStatus;
  statusLabel: string;
  reason: string | null;
  requestedAt: string | null;
  carrierDeadlineAt: string | null;
  carrierRespondedAt: string | null;
  carrierNote: string | null;
  escalatedAt: string | null;
  escalationCause: ReopenEscalationCause | null;
  escalationCauseLabel: string | null;
  adminAssigned: boolean;
  adminDecidedAt: string | null;
  adminReason: string | null;
};

export type IncidentView = {
  id: string;
  shipmentId: string;
  shipmentLabel: string;
  incidentType: IncidentType;
  incidentTypeLabel: string;
  title: string;
  description: string;
  occurredAt: string | null;
  reportedAt: string;
  reporterRole: "SHIPPER" | "CARRIER" | "DRIVER";
  reporterRoleLabel: string;
  status: IncidentStatus;
  statusLabel: string;
  escalationStatus: EscalationStatus;
  priority: null;
  attachments: { id: string }[];
  evidence: { upload: "optional"; maxCount: 5; reason: string };
  version: number;
  resolutionSummary: string | null;
  resolvedAt: string | null;
  objectionReason: string | null;
  objectedAt: string | null;
  closedAt: string | null;
  closeReason: string | null;
  reopen: ReopenView;
  capabilities: ReturnType<typeof capabilities>;
  createdAt: string;
  updatedAt: string;
};

export type IncidentEventView = {
  id: string;
  incidentId: string;
  action: IncidentAction;
  actionLabel: string;
  actorId: string;
  actorRole: keyof typeof roleLabels;
  actorRoleLabel: string;
  occurredAt: string;
  statusBefore: IncidentStatus;
  statusAfter: IncidentStatus;
  statusBeforeLabel: string;
  statusAfterLabel: string;
  note: string | null;
  evidence: { id: string }[];
  correlationId: string;
  visibility: "PARTICIPANT" | "INTERNAL";
};

export type NotificationView = {
  id: string;
  incidentId: string;
  eventType: IncidentAction;
  label: string;
  createdAt: string;
  read: boolean;
};

type IncidentSource = {
  _id: { toString(): string };
  shipmentId: { toString(): string };
  incidentType: IncidentType;
  title: string;
  description: string;
  occurredAt?: Date | null;
  reportedAt: Date;
  reporterId: { toString(): string };
  reporterRole: "SHIPPER" | "CARRIER" | "DRIVER";
  handlerId?: { toString(): string } | null;
  status: IncidentStatus;
  escalationStatus: EscalationStatus;
  version: number;
  resolutionSummary?: string | null;
  resolvedAt?: Date | null;
  objectionReason?: string | null;
  objectedAt?: Date | null;
  closedAt?: Date | null;
  closeReason?: string | null;
  reopenStatus?: ReopenStatus | null;
  reopenReason?: string | null;
  reopenRequestedAt?: Date | null;
  reopenCarrierDeadlineAt?: Date | null;
  reopenCarrierRespondedAt?: Date | null;
  reopenCarrierNote?: string | null;
  reopenEscalatedAt?: Date | null;
  reopenEscalationCause?: ReopenEscalationCause | null;
  reopenAdminDecidedAt?: Date | null;
  reopenAdminReason?: string | null;
  attachments?: { toString(): string }[];
  createdAt: Date;
  updatedAt: Date;
};

type EventSource = {
  _id: { toString(): string };
  incidentId: { toString(): string };
  action: IncidentAction;
  actorId?: { toString(): string } | null;
  actorRole: keyof typeof roleLabels;
  occurredAt: Date;
  statusBefore: IncidentStatus;
  statusAfter: IncidentStatus;
  note?: string | null;
  evidenceIds?: { toString(): string }[];
  correlationId: string;
  visibility: "PARTICIPANT" | "INTERNAL";
};

const evidenceReason = "Ảnh chứng cứ là tùy chọn, tối đa 5 ảnh. Báo cáo không có ảnh vẫn được ghi nhận.";

function iso(value: Date | null | undefined): string | null {
  return value ? value.toISOString() : null;
}

function reopenView(incident: IncidentSource): ReopenView {
  const status = incident.reopenStatus ?? "NONE";
  const cause = incident.reopenEscalationCause ?? null;
  return {
    status,
    statusLabel: reopenStatusLabels[status],
    reason: incident.reopenReason ?? null,
    requestedAt: iso(incident.reopenRequestedAt),
    carrierDeadlineAt: iso(incident.reopenCarrierDeadlineAt),
    carrierRespondedAt: iso(incident.reopenCarrierRespondedAt),
    carrierNote: incident.reopenCarrierNote ?? null,
    escalatedAt: iso(incident.reopenEscalatedAt),
    escalationCause: cause,
    escalationCauseLabel: cause ? escalationCauseLabels[cause] : null,
    adminAssigned: incident.handlerId != null,
    adminDecidedAt: iso(incident.reopenAdminDecidedAt),
    adminReason: incident.reopenAdminReason ?? null,
  };
}

export function toIncidentView(incident: IncidentSource, shipment: ShipmentAccess & { label: string }, actor: Actor, now = new Date()): IncidentView {
  return {
    id: incident._id.toString(),
    shipmentId: incident.shipmentId.toString(),
    shipmentLabel: shipment.label,
    incidentType: incident.incidentType,
    incidentTypeLabel: incidentTypeLabels[incident.incidentType],
    title: incident.title,
    description: incident.description,
    occurredAt: incident.occurredAt ? incident.occurredAt.toISOString() : null,
    reportedAt: incident.reportedAt.toISOString(),
    reporterRole: incident.reporterRole,
    reporterRoleLabel: roleLabels[incident.reporterRole],
    status: incident.status,
    statusLabel: incidentStatusLabels[incident.status],
    escalationStatus: incident.escalationStatus,
    priority: null,
    attachments: (incident.attachments ?? []).map((item) => ({ id: item.toString() })),
    evidence: { upload: "optional", maxCount: 5, reason: evidenceReason },
    version: incident.version,
    resolutionSummary: incident.resolutionSummary ?? null,
    resolvedAt: incident.resolvedAt ? incident.resolvedAt.toISOString() : null,
    objectionReason: incident.objectionReason ?? null,
    objectedAt: incident.objectedAt ? incident.objectedAt.toISOString() : null,
    closedAt: iso(incident.closedAt),
    closeReason: incident.closeReason ?? null,
    reopen: reopenView(incident),
    capabilities: capabilities(
      actor,
      {
        reporterId: incident.reporterId.toString(),
        reporterRole: incident.reporterRole,
        handlerId: incident.handlerId ? incident.handlerId.toString() : null,
        status: incident.status,
        incidentType: incident.incidentType,
        reopenStatus: incident.reopenStatus ?? "NONE",
        reopenCarrierDeadlineAt: incident.reopenCarrierDeadlineAt ?? null,
      },
      shipment,
      now,
    ),
    createdAt: incident.createdAt.toISOString(),
    updatedAt: incident.updatedAt.toISOString(),
  };
}

export function toEventView(event: EventSource): IncidentEventView | null {
  if (event.visibility !== "PARTICIPANT") return null;
  return {
    id: event._id.toString(),
    incidentId: event.incidentId.toString(),
    action: event.action,
    actionLabel: actionLabels[event.action],
    actorId: event.actorId ? event.actorId.toString() : "",
    actorRole: event.actorRole,
    actorRoleLabel: roleLabels[event.actorRole],
    occurredAt: event.occurredAt.toISOString(),
    statusBefore: event.statusBefore,
    statusAfter: event.statusAfter,
    statusBeforeLabel: incidentStatusLabels[event.statusBefore],
    statusAfterLabel: incidentStatusLabels[event.statusAfter],
    note: event.note ?? null,
    evidence: (event.evidenceIds ?? []).map((id) => ({ id: id.toString() })),
    correlationId: event.correlationId,
    visibility: "PARTICIPANT",
  };
}

export function toNotificationView(notification: {
  _id: { toString(): string };
  incidentId: { toString(): string };
  eventType: IncidentAction;
  label: string;
  createdAt: Date;
  readAt?: Date | null;
}): NotificationView {
  return {
    id: notification._id.toString(),
    incidentId: notification.incidentId.toString(),
    eventType: notification.eventType,
    label: notification.label,
    createdAt: notification.createdAt.toISOString(),
    read: notification.readAt != null,
  };
}
