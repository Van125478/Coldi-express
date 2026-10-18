import type { BusinessRole } from "@/models/session";
import { paths } from "@/app/paths";

export const incidentTypes = [
  "TEMPERATURE_ISSUE",
  "VEHICLE_ISSUE",
  "DELAY",
  "CARGO_ISSUE",
  "PICKUP_DELIVERY_ISSUE",
  "OTHER",
] as const;

export type IncidentType = (typeof incidentTypes)[number];

export const incidentTypeLabels: Record<IncidentType, string> = {
  TEMPERATURE_ISSUE: "Sự cố nhiệt độ",
  VEHICLE_ISSUE: "Sự cố phương tiện",
  DELAY: "Chậm trễ",
  CARGO_ISSUE: "Sự cố hàng hóa",
  PICKUP_DELIVERY_ISSUE: "Sự cố lấy/giao hàng",
  OTHER: "Khác",
};

export const incidentLimits = {
  titleMin: 5,
  titleMax: 120,
  descriptionMin: 20,
  descriptionMax: 2000,
  commentMin: 1,
  commentMax: 2000,
  noteMin: 1,
  noteMax: 2000,
  resolutionMin: 10,
  resolutionMax: 2000,
  objectionMin: 10,
  objectionMax: 2000,
  closeReasonMin: 10,
  closeReasonMax: 2000,
  reopenReasonMin: 10,
  reopenReasonMax: 2000,
} as const;

export const reportableShipmentStatuses = ["PUBLISHED", "MATCHED", "PICKUP_CONFIRMED", "IN_TRANSIT"] as const;

export function incidentListPath(role: BusinessRole): string {
  if (role === "CARRIER") return paths.carrierIncidents;
  if (role === "DRIVER") return paths.driverIncidents;
  return paths.shipperIncidents;
}

export function incidentDetailPath(role: BusinessRole, incidentId: string): string {
  return `${incidentListPath(role)}/${incidentId}`;
}

export function reportIncidentPath(role: BusinessRole, shipmentId: string): string {
  return `${incidentListPath(role)}/moi?shipmentId=${encodeURIComponent(shipmentId)}`;
}

export function incidentKey(prefix: string): string {
  return `${prefix}-${crypto.randomUUID()}`.slice(0, 80);
}
