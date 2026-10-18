import { Types } from "mongoose";
import { recordSuccessfulAudit } from "../audit/recordAudit.js";
import { getEnv } from "../config/env.js";
import { HttpError } from "../middlewares/errorHandler.js";
import { CommissionLedgerEvent } from "../models/commissionLedger.js";
import { AccountSubscription } from "../models/package.js";
import { Shipment } from "../models/shipment.js";
import { isEffectivePaid, resolveAccountEntitlements } from "../packages/entitlements.js";
import { CommissionInputError, roundHalfUpFee } from "./money.js";

export const commissionPolicyVersion = "COM-07A";
export const commissionSource = "SIMULATION" as const;

type SideName = "shipper" | "carrier";

export type SideSnapshot = {
  payerSide: "SHIPPER" | "CARRIER";
  payerAccountId: Types.ObjectId;
  planCode: string;
  planVersionId: Types.ObjectId;
  contractTermsId?: Types.ObjectId;
  baseFreightVnd: number;
  rateBps: number;
  calculatedFeeVnd: number;
  policyVersion: typeof commissionPolicyVersion;
  source: typeof commissionSource;
  environmentId: string;
  simulation: true;
  lockedAt: Date;
};

type StoredSide = {
  payerSide: "SHIPPER" | "CARRIER";
  payerAccountId: Types.ObjectId;
  planVersionId: Types.ObjectId;
  rateBps: number;
  baseFreightVnd: number;
  calculatedFeeVnd: number;
  policyVersion: string;
  environmentId: string;
};

export async function quoteForAccount(accountId: string, baseFreightVnd: number, expectedPlanVersionId?: string) {
  const entitlements = await resolveAccountEntitlements(accountId);
  if (entitlements.rateBps == null || entitlements.planCode == null || entitlements.planVersionId == null) {
    throw new HttpError(409, "commission_rate_unavailable", "Gói hiện tại không có tỷ lệ hoa hồng đã chốt. Không dùng mức trung bình.");
  }
  if (expectedPlanVersionId && expectedPlanVersionId !== entitlements.planVersionId) {
    throw new HttpError(409, "commission_quote_stale", "Gói đã đổi so với báo giá vừa xem. Hãy xem lại tỷ lệ rồi xác nhận lại.");
  }
  let fee: number;
  try {
    fee = roundHalfUpFee(baseFreightVnd, entitlements.rateBps);
  } catch (error) {
    if (error instanceof CommissionInputError) {
      throw new HttpError(400, "invalid_request", "Giá cước hoặc tỷ lệ hoa hồng không hợp lệ.");
    }
    throw error;
  }
  const confirmed = await resolveAccountEntitlements(accountId);
  if (
    confirmed.planVersionId !== entitlements.planVersionId ||
    confirmed.rateBps !== entitlements.rateBps ||
    confirmed.planCode !== entitlements.planCode
  ) {
    throw new HttpError(409, "commission_quote_stale", "Gói đã đổi so với báo giá vừa xem. Hãy xem lại tỷ lệ rồi xác nhận lại.");
  }
  const subscription = await AccountSubscription.findOne({ accountId }).select("contractTermsId planVersionId rateBps startAt endAt downgradeToFreeAt");
  const paid = subscription && isEffectivePaid(subscription, new Date()) ? subscription : null;
  if (paid && (paid.planVersionId.toString() !== entitlements.planVersionId || paid.rateBps !== entitlements.rateBps)) {
    throw new HttpError(409, "commission_quote_stale", "Gói đã đổi so với báo giá vừa xem. Hãy xem lại tỷ lệ rồi xác nhận lại.");
  }
  const env = getEnv();
  const snapshot: SideSnapshot = {
    payerSide: entitlements.role === "CARRIER" ? "CARRIER" : "SHIPPER",
    payerAccountId: new Types.ObjectId(accountId),
    planCode: entitlements.planCode,
    planVersionId: new Types.ObjectId(entitlements.planVersionId),
    ...(paid?.contractTermsId ? { contractTermsId: paid.contractTermsId } : {}),
    baseFreightVnd,
    rateBps: entitlements.rateBps,
    calculatedFeeVnd: fee,
    policyVersion: commissionPolicyVersion,
    source: commissionSource,
    environmentId: env.commissionEnvironmentId,
    simulation: true,
    lockedAt: new Date(),
  };
  return snapshot;
}

export function readExpectedPlanVersion(body: unknown): string | undefined {
  if (typeof body !== "object" || body === null || !("expectedPlanVersionId" in body)) return undefined;
  const value = (body as { expectedPlanVersionId?: unknown }).expectedPlanVersionId;
  if (typeof value !== "string" || !Types.ObjectId.isValid(value)) {
    throw new HttpError(400, "invalid_request", "Mã phiên bản gói không hợp lệ.");
  }
  return value;
}

export async function rememberEstimated(shipmentId: string, snapshot: SideSnapshot): Promise<void> {
  try {
    await insertLedger({
      shipmentId,
      snapshot,
      eventType: "ESTIMATED",
      amountVnd: snapshot.calculatedFeeVnd,
      deltaVnd: 0,
      idempotencyKey: `estimated:${shipmentId}:${snapshot.payerSide}`,
    });
  } catch (error) {
    console.error("Commission estimate was not stored.", error instanceof Error ? error.name : "error");
  }
}

export async function accrueDeliveredShipment(shipmentId: string): Promise<"applied" | "pending" | "skipped"> {
  const shipment = await Shipment.findById(shipmentId);
  if (!shipment || shipment.status !== "DELIVERY_CONFIRMED") return "skipped";
  const commission = shipment.commission;
  if (!commission) return "skipped";
  const sides: SideName[] = [];
  if (commission.shipper && commission.shipperStatus === "ESTIMATED") sides.push("shipper");
  if (commission.carrier && commission.carrierStatus === "ESTIMATED") sides.push("carrier");
  if (sides.length === 0) {
    if (commission.outbox?.status === "APPLIED") return "applied";
    const accrued = commission.shipperStatus === "ACCRUED" || commission.carrierStatus === "ACCRUED";
    if (!accrued) return "skipped";
    await Shipment.updateOne(
      { _id: shipmentId, status: "DELIVERY_CONFIRMED" },
      { $set: { "commission.outbox.status": "APPLIED", "commission.outbox.appliedAt": new Date() } },
    );
    return "applied";
  }
  try {
    for (const side of sides) {
      const snapshot = commission[side];
      if (!snapshot) continue;
      await insertLedger({
        shipmentId,
        snapshot,
        eventType: "ACCRUAL",
        amountVnd: snapshot.calculatedFeeVnd,
        deltaVnd: snapshot.calculatedFeeVnd,
        idempotencyKey: `accrual:${shipmentId}:${snapshot.payerSide}`,
      });
    }
  } catch (error) {
    await Shipment.updateOne(
      { _id: shipmentId, status: "DELIVERY_CONFIRMED" },
      { $set: { "commission.outbox.status": "ERROR" } },
    );
    console.error("Commission accrual did not finish.", error instanceof Error ? error.name : "error");
    return "pending";
  }
  const applied = await Shipment.updateOne(
    {
      _id: shipmentId,
      status: "DELIVERY_CONFIRMED",
      ...(sides.includes("shipper") ? { "commission.shipperStatus": "ESTIMATED" } : {}),
      ...(sides.includes("carrier") ? { "commission.carrierStatus": "ESTIMATED" } : {}),
    },
    {
      $set: {
        ...(sides.includes("shipper") ? { "commission.shipperStatus": "ACCRUED" } : {}),
        ...(sides.includes("carrier") ? { "commission.carrierStatus": "ACCRUED" } : {}),
        "commission.outbox.status": "APPLIED",
        "commission.outbox.appliedAt": new Date(),
      },
    },
  );
  if (applied.modifiedCount === 1) {
    const actorId = shipment.deliveryConfirmedBy?.toString();
    if (actorId) {
      await recordSuccessfulAudit({
        action: "COMMISSION_ACCRUED",
        actorId,
        actorRole: "DRIVER",
        resourceType: "shipment",
        resourceId: shipmentId,
        statusBefore: "ESTIMATED",
        statusAfter: "ACCRUED",
        fields: sides,
      });
    }
  }
  return applied.matchedCount === 1 ? "applied" : "pending";
}

export async function reconcileCommissionOutbox(): Promise<number> {
  if (!getEnv().commissionSimulationAllowed) return 0;
  const pending = await Shipment.find({
    status: "DELIVERY_CONFIRMED",
    $or: [
      { "commission.outbox.status": { $in: ["PENDING", "ERROR"] } },
      { "commission.shipperStatus": "ESTIMATED" },
      { "commission.carrierStatus": "ESTIMATED" },
    ],
  }).select("_id");
  let repaired = 0;
  for (const shipment of pending) {
    const result = await accrueDeliveredShipment(shipment._id.toString());
    if (result === "applied") repaired += 1;
  }
  return repaired;
}

async function insertLedger(input: {
  shipmentId: string;
  snapshot: StoredSide;
  eventType: "ESTIMATED" | "ACCRUAL";
  amountVnd: number;
  deltaVnd: number;
  idempotencyKey: string;
}): Promise<void> {
  try {
    await CommissionLedgerEvent.create({
      shipmentId: input.shipmentId,
      payerSide: input.snapshot.payerSide,
      payerAccountId: input.snapshot.payerAccountId,
      eventType: input.eventType,
      amountVnd: input.amountVnd,
      deltaVnd: input.deltaVnd,
      planVersionId: input.snapshot.planVersionId,
      rateBps: input.snapshot.rateBps,
      baseFreightVnd: input.snapshot.baseFreightVnd,
      idempotencyKey: input.idempotencyKey,
      policyVersion: input.snapshot.policyVersion,
      environmentId: input.snapshot.environmentId,
      simulation: true,
      paymentCollected: false,
      recordedAt: new Date(),
    });
  } catch (error) {
    if (isDuplicate(error)) return;
    throw error;
  }
}

function isDuplicate(error: unknown): boolean {
  return typeof error === "object" && error !== null && "code" in error && (error as { code?: unknown }).code === 11000;
}
