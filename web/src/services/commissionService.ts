import { apiRequest } from "@/services/apiClient";

export type CommissionStatus = "ABSENT" | "ESTIMATED" | "ACCRUED" | "VOID" | "ON_HOLD";

export type CommissionLedgerRow = {
  eventType: "ESTIMATED" | "ACCRUAL" | "VOID" | "HOLD" | "RELEASE" | "ADJUSTMENT";
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
  ledger: CommissionLedgerRow[];
};

export type CommissionEnvelope = {
  available: boolean;
  simulation: boolean;
  paymentCollected: false;
  banner: string;
};

export function getCommissionShipment(shipmentId: string): Promise<CommissionEnvelope & { shipment: CommissionEntry }> {
  return apiRequest(`/api/commission/shipments/${shipmentId}`);
}

export function getMyCommission(): Promise<CommissionEnvelope & { entries: CommissionEntry[] }> {
  return apiRequest("/api/commission/mine");
}
