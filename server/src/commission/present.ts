import { CommissionLedgerEvent } from "../models/commissionLedger.js";
import type { CommissionStatus } from "./lifecycle.js";

export const commissionBanner = "Mô phỏng Demo/QA — Không phải tiền đã thu";

const statuses = new Set<CommissionStatus>(["ABSENT", "ESTIMATED", "ACCRUED", "VOID", "ON_HOLD"]);

type SideDoc = {
  payerSide: "SHIPPER" | "CARRIER";
  payerAccountId: { toString(): string };
  planCode: string;
  planVersionId: { toString(): string };
  baseFreightVnd: number;
  rateBps: number;
  calculatedFeeVnd: number;
  lockedAt: Date;
};

type CommissionDoc = {
  shipper?: SideDoc | null;
  carrier?: SideDoc | null;
  shipperStatus?: string | null;
  carrierStatus?: string | null;
  outbox?: { status?: string | null } | null;
};

export type LedgerRow = {
  eventType: string;
  amountVnd: number;
  deltaVnd: number;
  recordedAt: string;
  simulation: true;
  paymentCollected: false;
};

export type CommissionEntry = {
  shipmentId: string;
  legacy: boolean;
  payerSide: "SHIPPER" | "CARRIER" | null;
  status: CommissionStatus;
  baseFreightVnd: number | null;
  planCode: string | null;
  planVersionId: string | null;
  rateBps: number | null;
  feeVnd: number | null;
  settlementVnd: number | null;
  outboxStatus: "PENDING" | "APPLIED" | "ERROR" | null;
  lockedAt: string | null;
  recordedAt: string | null;
  ledger: LedgerRow[];
};

export function presentEntry(shipmentId: string, commission: CommissionDoc | null | undefined, side: "shipper" | "carrier", ledger: LedgerRow[], recordedAt: string | null): CommissionEntry {
  const snapshot = commission?.[side] ?? null;
  const rawStatus = side === "shipper" ? commission?.shipperStatus : commission?.carrierStatus;
  const status = snapshot && rawStatus && statuses.has(rawStatus as CommissionStatus) ? (rawStatus as CommissionStatus) : snapshot ? "ESTIMATED" : "ABSENT";
  const outbox = commission?.outbox?.status;
  const outboxStatus = outbox === "PENDING" || outbox === "APPLIED" || outbox === "ERROR" ? outbox : null;
  const fee = snapshot ? snapshot.calculatedFeeVnd : null;
  const base = snapshot ? snapshot.baseFreightVnd : null;
  return {
    shipmentId,
    legacy: snapshot == null,
    payerSide: snapshot ? snapshot.payerSide : side === "shipper" ? "SHIPPER" : "CARRIER",
    status,
    baseFreightVnd: base,
    planCode: snapshot?.planCode ?? null,
    planVersionId: snapshot ? snapshot.planVersionId.toString() : null,
    rateBps: snapshot?.rateBps ?? null,
    feeVnd: fee,
    settlementVnd: base == null || fee == null ? null : side === "shipper" ? base + fee : base - fee,
    outboxStatus: snapshot ? outboxStatus : null,
    lockedAt: snapshot ? snapshot.lockedAt.toISOString() : null,
    recordedAt,
    ledger: snapshot ? ledger : [],
  };
}

export async function ledgerFor(shipmentId: string, payerAccountId: string, payerSide: "SHIPPER" | "CARRIER"): Promise<{ rows: LedgerRow[]; recordedAt: string | null }> {
  const events = await CommissionLedgerEvent.find({ shipmentId, payerAccountId, payerSide }).sort({ recordedAt: 1, _id: 1 });
  const rows = events.map((event) => ({
    eventType: event.eventType,
    amountVnd: event.amountVnd,
    deltaVnd: event.deltaVnd,
    recordedAt: event.recordedAt.toISOString(),
    simulation: true as const,
    paymentCollected: false as const,
  }));
  return { rows, recordedAt: rows.at(-1)?.recordedAt ?? null };
}
