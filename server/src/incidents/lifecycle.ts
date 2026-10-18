import type { EscalationStatus, IncidentStatus, ReminderKind } from "./policy.js";

export const initialIncidentStatus: IncidentStatus = "OPEN";
export const initialEscalationStatus: EscalationStatus = "NONE";

const primary = {
  ACKNOWLEDGE: { from: "OPEN", to: "ACKNOWLEDGED" },
  START: { from: "ACKNOWLEDGED", to: "IN_PROGRESS" },
  RESOLVE: { from: "IN_PROGRESS", to: "RESOLVED" },
  OBJECT: { from: "RESOLVED", to: "IN_PROGRESS" },
} as const;

export type PrimaryAction = keyof typeof primary;

export type TransitionResult =
  | { ok: true; from: IncidentStatus; to: IncidentStatus }
  | { ok: false; code: "invalid_transition" | "incident_closed" };

export function primaryTransition(action: PrimaryAction, status: IncidentStatus): TransitionResult {
  if (status === "CLOSED") return { ok: false, code: "incident_closed" };
  const rule = primary[action];
  if (status !== rule.from) return { ok: false, code: "invalid_transition" };
  return { ok: true, from: rule.from, to: rule.to };
}

/**
 * INC-CLOSE-01 is open. HTTP must call this with policyApproved false.
 * The domain can represent CLOSED so the invariant is testable.
 */
export function closeTransition(status: IncidentStatus, policyApproved: boolean): TransitionResult {
  if (!policyApproved) return { ok: false, code: "invalid_transition" };
  if (status !== "RESOLVED") return { ok: false, code: "invalid_transition" };
  return { ok: true, from: "RESOLVED", to: "CLOSED" };
}

export function reopenTransition(): { ok: false; code: "incident_reopen_denied" } {
  return { ok: false, code: "incident_reopen_denied" };
}

const escalation = {
  REQUEST: { from: "NONE", to: "REQUESTED" },
  ACTIVATE: { from: "REQUESTED", to: "ACTIVE" },
  DECLINE: { from: "REQUESTED", to: "DECLINED" },
  FINISH: { from: "ACTIVE", to: "FINISHED" },
} as const;

export type EscalationAction = keyof typeof escalation;

export type EscalationResult =
  | { ok: true; from: EscalationStatus; to: EscalationStatus; primaryStatus: IncidentStatus }
  | { ok: false; code: "invalid_escalation" };

/** Escalation never replaces the primary status. The enum itself is a technical proposal. */
export function escalationTransition(
  action: EscalationAction,
  escalationStatus: EscalationStatus,
  primaryStatus: IncidentStatus,
): EscalationResult {
  const rule = escalation[action];
  if (escalationStatus !== rule.from) return { ok: false, code: "invalid_escalation" };
  return { ok: true, from: rule.from, to: rule.to, primaryStatus };
}

export type ReminderPolicy = {
  kind: ReminderKind;
  enabled: boolean;
  intervalMinutes: number | null;
};

export type ReminderIncident = {
  status: IncidentStatus;
  escalationStatus: EscalationStatus;
  reportedAt: Date;
  updatedAt: Date;
  resolvedAt: Date | null;
};

/**
 * No SLA is hardcoded. A disabled or unconfigured policy never becomes due.
 * This function does not send email, SMS, or push.
 */
export function evaluateReminder(policy: ReminderPolicy, incident: ReminderIncident, now: Date): { kind: ReminderKind } | null {
  if (!policy.enabled || policy.intervalMinutes === null || policy.intervalMinutes < 1) return null;
  const anchor = reminderAnchor(policy.kind, incident);
  if (!anchor) return null;
  if (now.getTime() - anchor.getTime() < policy.intervalMinutes * 60_000) return null;
  return { kind: policy.kind };
}

function reminderAnchor(kind: ReminderKind, incident: ReminderIncident): Date | null {
  if (kind === "ACK_PENDING") return incident.status === "OPEN" ? incident.reportedAt : null;
  if (kind === "PROGRESS_PENDING") return incident.status === "ACKNOWLEDGED" || incident.status === "IN_PROGRESS" ? incident.updatedAt : null;
  if (kind === "ESCALATION_PENDING") return incident.escalationStatus === "REQUESTED" ? incident.updatedAt : null;
  if (kind === "RESOLUTION_FEEDBACK_PENDING") return incident.status === "RESOLVED" ? incident.resolvedAt : null;
  return null;
}
