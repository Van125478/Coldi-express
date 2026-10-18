import { apiRequest } from "@/services/apiClient";
import type { IncidentType } from "@/features/incidents/incidentCopy";

export type IncidentCapabilities = {
  acknowledge: boolean;
  start: boolean;
  resolve: boolean;
  object: boolean;
  comment: boolean;
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
  attachments: [];
  evidence: { upload: "blocked"; reason: string };
  version: number;
  resolutionSummary: string | null;
  resolvedAt: string | null;
  objectionReason: string | null;
  objectedAt: string | null;
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

export function listIncidentNotifications(): Promise<{ notifications: IncidentNotificationRecord[] }> {
  return apiRequest("/api/incidents/notifications");
}

export function unreadIncidentCount(): Promise<{ unread: number }> {
  return apiRequest("/api/incidents/notifications/unread-count");
}

export function markIncidentNotificationRead(id: string): Promise<{ notification: IncidentNotificationRecord }> {
  return apiRequest(`/api/incidents/notifications/${id}/read`, { method: "POST", body: JSON.stringify({}) });
}
