import { apiRequest } from "@/services/apiClient";
import type { IncidentType } from "@/features/incidents/incidentCopy";

export type IncidentCapabilities = {
  acknowledge: boolean;
  start: boolean;
  resolve: boolean;
  object: boolean;
  comment: boolean;
  close: boolean;
  requestReopen: boolean;
  respondReopen: boolean;
  adjudicateReopen: boolean;
};

export type IncidentReopenRecord = {
  status: "NONE" | "PENDING_CARRIER" | "APPROVED_BY_CARRIER" | "AWAITING_ADMIN" | "APPROVED_BY_ADMIN" | "REJECTED_BY_ADMIN";
  statusLabel: string;
  reason: string | null;
  requestedAt: string | null;
  carrierDeadlineAt: string | null;
  carrierRespondedAt: string | null;
  carrierNote: string | null;
  escalatedAt: string | null;
  escalationCause: "CARRIER_REJECTED" | "CARRIER_TIMEOUT" | null;
  escalationCauseLabel: string | null;
  adminAssigned: boolean;
  adminDecidedAt: string | null;
  adminReason: string | null;
};

export type IncidentRecord = {
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
  status: "OPEN" | "ACKNOWLEDGED" | "IN_PROGRESS" | "RESOLVED" | "CLOSED";
  statusLabel: string;
  escalationStatus: "NONE" | "REQUESTED" | "ACTIVE" | "FINISHED" | "DECLINED";
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
  reopen: IncidentReopenRecord;
  capabilities: IncidentCapabilities;
  createdAt: string;
  updatedAt: string;
};

export type IncidentEventRecord = {
  id: string;
  incidentId: string;
  action: string;
  actionLabel: string;
  actorId: string;
  actorRole: string;
  actorRoleLabel: string;
  occurredAt: string;
  statusBeforeLabel: string;
  statusAfterLabel: string;
  note: string | null;
  correlationId: string;
};

export type IncidentNotificationRecord = {
  id: string;
  incidentId: string;
  eventType: string;
  label: string;
  createdAt: string;
  read: boolean;
};

export type IncidentDraft = {
  shipmentId: string;
  incidentType: IncidentType;
  title: string;
  description: string;
  occurredAt?: string;
  evidenceIds?: string[];
  idempotencyKey: string;
};

export function listIncidents(shipmentId?: string): Promise<{ incidents: IncidentRecord[]; nextCursor: string | null }> {
  const params = new URLSearchParams();
  if (shipmentId) params.set("shipmentId", shipmentId);
  const query = params.toString();
  return apiRequest(`/api/incidents${query ? `?${query}` : ""}`);
}

export function getIncident(id: string): Promise<{ incident: IncidentRecord; events: IncidentEventRecord[] }> {
  return apiRequest(`/api/incidents/${id}`);
}

export function createIncident(draft: IncidentDraft): Promise<{ incident: IncidentRecord }> {
  return apiRequest("/api/incidents", { method: "POST", body: JSON.stringify(draft) });
}

export function acknowledgeIncident(id: string, expectedVersion: number, idempotencyKey: string): Promise<{ incident: IncidentRecord }> {
  return apiRequest(`/api/incidents/${id}/acknowledge`, { method: "POST", body: JSON.stringify({ expectedVersion, idempotencyKey }) });
}

export function startIncident(id: string, expectedVersion: number, idempotencyKey: string, note: string): Promise<{ incident: IncidentRecord }> {
  return apiRequest(`/api/incidents/${id}/start`, { method: "POST", body: JSON.stringify({ expectedVersion, idempotencyKey, note }) });
}

export function resolveIncident(id: string, expectedVersion: number, idempotencyKey: string, resolutionSummary: string): Promise<{ incident: IncidentRecord }> {
  return apiRequest(`/api/incidents/${id}/resolve`, { method: "POST", body: JSON.stringify({ expectedVersion, idempotencyKey, resolutionSummary }) });
}

export function objectIncident(id: string, expectedVersion: number, idempotencyKey: string, objectionReason: string): Promise<{ incident: IncidentRecord }> {
  return apiRequest(`/api/incidents/${id}/object`, { method: "POST", body: JSON.stringify({ expectedVersion, idempotencyKey, objectionReason }) });
}

export function commentIncident(id: string, expectedVersion: number, idempotencyKey: string, body: string): Promise<{ incident: IncidentRecord }> {
  return apiRequest(`/api/incidents/${id}/comments`, { method: "POST", body: JSON.stringify({ expectedVersion, idempotencyKey, body }) });
}

export function closeIncident(id: string, expectedVersion: number, idempotencyKey: string, closeReason: string): Promise<{ incident: IncidentRecord }> {
  return apiRequest(`/api/incidents/${id}/close`, { method: "POST", body: JSON.stringify({ expectedVersion, idempotencyKey, closeReason }) });
}

export function requestIncidentReopen(id: string, expectedVersion: number, idempotencyKey: string, reason: string): Promise<{ incident: IncidentRecord }> {
  return apiRequest(`/api/incidents/${id}/reopen-request`, { method: "POST", body: JSON.stringify({ expectedVersion, idempotencyKey, reason }) });
}

export function respondIncidentReopen(
  id: string,
  expectedVersion: number,
  idempotencyKey: string,
  decision: "APPROVE" | "REJECT",
  note?: string,
): Promise<{ incident: IncidentRecord }> {
  return apiRequest(`/api/incidents/${id}/reopen-response`, { method: "POST", body: JSON.stringify({ expectedVersion, idempotencyKey, decision, ...(note ? { note } : {}) }) });
}

export function decideIncidentReopen(
  id: string,
  expectedVersion: number,
  idempotencyKey: string,
  decision: "APPROVE" | "REJECT",
  reason: string,
): Promise<{ incident: IncidentRecord }> {
  return apiRequest(`/api/incidents/${id}/reopen-decision`, { method: "POST", body: JSON.stringify({ expectedVersion, idempotencyKey, decision, reason }) });
}

export function listIncidentNotifications(): Promise<{ notifications: IncidentNotificationRecord[] }> {
  return apiRequest("/api/incidents/notifications");
}

export function unreadIncidentCount(): Promise<{ unread: number }> {
  return apiRequest("/api/incidents/notifications/unread-count");
}

export function markIncidentNotificationRead(id: string): Promise<{ notification: IncidentNotificationRecord }> {
  return apiRequest(`/api/incidents/notifications/${id}/read`, { method: "POST", body: JSON.stringify({}) });
}
