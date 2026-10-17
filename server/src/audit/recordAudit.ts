import { AuditLog, type AuditAction } from "../models/auditLog.js";
import type { UserRole } from "../models/user.js";

const correlationPattern = /^[A-Za-z0-9._:-]{1,64}$/;

export type SuccessfulAudit = {
  action: AuditAction;
  actorId: string;
  actorRole: UserRole;
  resourceType: "shipment" | "vehicle" | "driver";
  resourceId: string;
  statusBefore?: string | undefined;
  statusAfter?: string | undefined;
  relatedCarrierId?: string | undefined;
  correlationId?: string | undefined;
  fields?: readonly string[] | undefined;
};

export function readCorrelationId(header: unknown): string | undefined {
  const value = Array.isArray(header) ? header[0] : header;
  return typeof value === "string" && correlationPattern.test(value) ? value : undefined;
}

export async function recordSuccessfulAudit(entry: SuccessfulAudit): Promise<void> {
  try {
    await AuditLog.create({
      action: entry.action,
      actorId: entry.actorId,
      actorRole: entry.actorRole,
      resourceType: entry.resourceType,
      resourceId: entry.resourceId,
      outcome: "success",
      occurredAt: new Date(),
      ...(entry.statusBefore ? { statusBefore: entry.statusBefore } : {}),
      ...(entry.statusAfter ? { statusAfter: entry.statusAfter } : {}),
      ...(entry.relatedCarrierId ? { relatedCarrierId: entry.relatedCarrierId } : {}),
      ...(entry.correlationId ? { correlationId: entry.correlationId } : {}),
      ...(entry.fields && entry.fields.length > 0 ? { fields: [...entry.fields] } : {}),
    });
  } catch (error) {
    if (!isDuplicate(error)) {
      console.error(`Audit log was not stored for ${entry.action}.`);
    }
  }
}

function isDuplicate(error: unknown): boolean {
  return typeof error === "object" && error !== null && "code" in error && (error as { code: unknown }).code === 11000;
}
