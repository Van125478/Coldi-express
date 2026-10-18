import type { Actor, ShipmentAccess } from "./access.js";
import { capabilities } from "./access.js";
import type { EscalationStatus, IncidentAction, IncidentStatus, IncidentType } from "./policy.js";
import { incidentStatusLabels, incidentTypeLabels } from "./policy.js";

const roleLabels = {
  SHIPPER: "Chủ hàng",
  CARRIER: "Nhà xe",
  DRIVER: "Tài xế",
  ADMIN: "Quản trị",
} as const;

const actionLabels: Record<IncidentAction, string> = {
  CREATED: "Đã tạo báo cáo",
  ACKNOWLEDGED: "Đã tiếp nhận",
  INVESTIGATION_STARTED: "Đã bắt đầu xử lý",
  COMMENT: "Đã thêm cập nhật",
  RESOLVED: "Đã gửi kết quả xử lý",
  OBJECTED: "Đã phản đối kết quả",
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
  attachments: [];
  evidence: { upload: "blocked"; reason: string };
  version: number;
  resolutionSummary: string | null;
  resolvedAt: string | null;
  objectionReason: string | null;
  objectedAt: string | null;
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
  createdAt: Date;
  updatedAt: Date;
};

type EventSource = {
  _id: { toString(): string };
  incidentId: { toString(): string };
  action: IncidentAction;
  actorId: { toString(): string };
  actorRole: keyof typeof roleLabels;
  occurredAt: Date;
  statusBefore: IncidentStatus;
  statusAfter: IncidentStatus;
  note?: string | null;
  correlationId: string;
  visibility: "PARTICIPANT" | "INTERNAL";
};

const evidenceReason = "Ảnh chứng cứ chưa mở vì chưa có kho riêng và bước kiểm tra nội dung.";

export function toIncidentView(incident: IncidentSource, shipment: ShipmentAccess & { label: string }, actor: Actor): IncidentView {
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
    attachments: [],
    evidence: { upload: "blocked", reason: evidenceReason },
    version: incident.version,
    resolutionSummary: incident.resolutionSummary ?? null,
    resolvedAt: incident.resolvedAt ? incident.resolvedAt.toISOString() : null,
    objectionReason: incident.objectionReason ?? null,
    objectedAt: incident.objectedAt ? incident.objectedAt.toISOString() : null,
    capabilities: capabilities(
      actor,
      {
        reporterId: incident.reporterId.toString(),
        reporterRole: incident.reporterRole,
        handlerId: incident.handlerId ? incident.handlerId.toString() : null,
        status: incident.status,
      },
      shipment,
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
    actorId: event.actorId.toString(),
    actorRole: event.actorRole,
    actorRoleLabel: roleLabels[event.actorRole],
    occurredAt: event.occurredAt.toISOString(),
    statusBefore: event.statusBefore,
    statusAfter: event.statusAfter,
    statusBeforeLabel: incidentStatusLabels[event.statusBefore],
    statusAfterLabel: incidentStatusLabels[event.statusAfter],
    note: event.note ?? null,
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
