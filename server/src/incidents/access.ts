import type { UserRole } from "../models/user.js";
import type { IncidentStatus } from "./policy.js";
import { reportableShipmentStatuses } from "./policy.js";

export type Actor = { id: string; role: UserRole };

export type ShipmentAccess = {
  id: string;
  shipperId: string;
  carrierId: string | null;
  driverId: string | null;
  status: string;
};

export type IncidentAccess = {
  reporterId: string;
  reporterRole: "SHIPPER" | "CARRIER" | "DRIVER";
  handlerId: string | null;
  status: IncidentStatus;
};

export type CaseScope = "none" | "participant" | "own_report" | "handler";

export function createDecision(actor: Actor, shipment: ShipmentAccess): "allow" | "hidden" | "window" {
  const owns =
    (actor.role === "SHIPPER" && actor.id === shipment.shipperId) ||
    (actor.role === "CARRIER" && shipment.carrierId === actor.id) ||
    (actor.role === "DRIVER" && shipment.driverId === actor.id);
  if (!owns) return "hidden";
  if (!reportableShipmentStatuses.includes(shipment.status as (typeof reportableShipmentStatuses)[number])) return "window";
  return "allow";
}

export function canCreate(actor: Actor, shipment: ShipmentAccess): boolean {
  return createDecision(actor, shipment) === "allow";
}

export function caseScope(actor: Actor, incident: IncidentAccess, shipment: ShipmentAccess): CaseScope {
  if (actor.role === "SHIPPER" && actor.id === shipment.shipperId) return "participant";
  if (actor.role === "CARRIER" && shipment.carrierId === actor.id) return "handler";
  if (actor.role === "DRIVER" && shipment.driverId === actor.id) return "participant";
  if (actor.role === "DRIVER" && incident.reporterId === actor.id && incident.reporterRole === "DRIVER") return "own_report";
  if (actor.role === "ADMIN" && incident.handlerId === actor.id) return "participant";
  return "none";
}

export function isCarrierHandler(actor: Actor, shipment: ShipmentAccess): boolean {
  return actor.role === "CARRIER" && shipment.carrierId === actor.id;
}

export function canComment(actor: Actor, scope: CaseScope, status: IncidentStatus): boolean {
  if (actor.role === "ADMIN") return false;
  return scope !== "none" && status !== "CLOSED";
}

export function canObject(actor: Actor, incident: IncidentAccess, shipment: ShipmentAccess): boolean {
  if (incident.status !== "RESOLVED") return false;
  if (isCarrierHandler(actor, shipment)) return false;
  if (actor.role === "SHIPPER" && actor.id === shipment.shipperId) return true;
  return incident.reporterId === actor.id && actor.role !== "CARRIER";
}

export type Capabilities = {
  acknowledge: boolean;
  start: boolean;
  resolve: boolean;
  object: boolean;
  comment: boolean;
};

export function capabilities(actor: Actor, incident: IncidentAccess, shipment: ShipmentAccess): Capabilities {
  const scope = caseScope(actor, incident, shipment);
  const handler = isCarrierHandler(actor, shipment) && scope === "handler";
  return {
    acknowledge: handler && incident.status === "OPEN",
    start: handler && incident.status === "ACKNOWLEDGED",
    resolve: handler && incident.status === "IN_PROGRESS",
    object: canObject(actor, incident, shipment),
    comment: canComment(actor, scope, incident.status),
  };
}

/** Minimum recipient set. Never every carrier or every admin. */
export function recipientIds(input: {
  actorId: string;
  reporterId: string;
  handlerId: string | null;
  shipperId: string;
  carrierId: string | null;
  driverId: string | null;
}): string[] {
  const ids = new Set<string>();
  for (const id of [input.shipperId, input.carrierId, input.driverId, input.reporterId, input.handlerId]) {
    if (id && id !== input.actorId) ids.add(id);
  }
  return [...ids];
}
