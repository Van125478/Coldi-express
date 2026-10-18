import type { UserRole } from "../models/user.js";
import type { IncidentStatus, IncidentType, ReopenStatus } from "./policy.js";
import { closableIncidentTypes, reportableShipmentStatuses } from "./policy.js";

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
  incidentType?: IncidentType;
  reopenStatus?: ReopenStatus;
  reopenCarrierDeadlineAt?: Date | null;
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

export function isClosable(incident: IncidentAccess): boolean {
  return incident.incidentType !== undefined && closableIncidentTypes.includes(incident.incidentType);
}

/** Only the carrier currently assigned to the shipment closes a resolved vehicle incident. */
export function canClose(actor: Actor, incident: IncidentAccess, shipment: ShipmentAccess): boolean {
  return isClosable(incident) && incident.status === "RESOLVED" && isCarrierHandler(actor, shipment);
}

export function canRequestReopen(actor: Actor, incident: IncidentAccess, shipment: ShipmentAccess): boolean {
  return (
    isClosable(incident) &&
    incident.status === "CLOSED" &&
    (incident.reopenStatus ?? "NONE") === "NONE" &&
    actor.role === "SHIPPER" &&
    actor.id === shipment.shipperId
  );
}

export function carrierWindowOpen(incident: IncidentAccess, now: Date): boolean {
  const deadline = incident.reopenCarrierDeadlineAt;
  return deadline instanceof Date && now.getTime() < deadline.getTime();
}

export function canRespondReopen(actor: Actor, incident: IncidentAccess, shipment: ShipmentAccess, now: Date): boolean {
  return (
    isClosable(incident) &&
    incident.status === "CLOSED" &&
    incident.reopenStatus === "PENDING_CARRIER" &&
    carrierWindowOpen(incident, now) &&
    isCarrierHandler(actor, shipment)
  );
}

/**
 * Admin adjudication uses the existing assignment rule: the admin whose id is handlerId.
 * There is no approved routing that sets handlerId, so an unassigned admin cannot decide.
 */
export function canAdjudicateReopen(actor: Actor, incident: IncidentAccess): boolean {
  return (
    isClosable(incident) &&
    incident.status === "CLOSED" &&
    incident.reopenStatus === "AWAITING_ADMIN" &&
    actor.role === "ADMIN" &&
    incident.handlerId !== null &&
    incident.handlerId === actor.id
  );
}

export type Capabilities = {
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

export function capabilities(actor: Actor, incident: IncidentAccess, shipment: ShipmentAccess, now = new Date()): Capabilities {
  const scope = caseScope(actor, incident, shipment);
  const handler = isCarrierHandler(actor, shipment) && scope === "handler";
  return {
    acknowledge: handler && incident.status === "OPEN",
    start: handler && incident.status === "ACKNOWLEDGED",
    resolve: handler && incident.status === "IN_PROGRESS",
    object: canObject(actor, incident, shipment),
    comment: canComment(actor, scope, incident.status),
    close: handler && canClose(actor, incident, shipment),
    requestReopen: canRequestReopen(actor, incident, shipment),
    respondReopen: handler && canRespondReopen(actor, incident, shipment, now),
    adjudicateReopen: canAdjudicateReopen(actor, incident),
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
