import { Schema, model } from "mongoose";

export const ledgerEventTypes = ["ESTIMATED", "ACCRUAL", "VOID", "HOLD", "RELEASE", "ADJUSTMENT"] as const;

const commissionLedgerSchema = new Schema(
  {
    shipmentId: { type: Schema.Types.ObjectId, ref: "Shipment", required: true, index: true },
    payerSide: { type: String, required: true, enum: ["SHIPPER", "CARRIER"] },
    payerAccountId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    eventType: { type: String, required: true, enum: ledgerEventTypes },
    amountVnd: { type: Number, required: true },
    deltaVnd: { type: Number, required: true },
    planVersionId: { type: Schema.Types.ObjectId, ref: "PlanVersion" },
    rateBps: { type: Number, required: true },
    baseFreightVnd: { type: Number, required: true },
    idempotencyKey: { type: String, required: true },
    policyVersion: { type: String, required: true },
    environmentId: { type: String, required: true },
    simulation: { type: Boolean, required: true, validate: (value: boolean) => value === true },
    paymentCollected: { type: Boolean, required: true, validate: (value: boolean) => value === false },
    recordedAt: { type: Date, required: true },
  },
  { versionKey: false },
);

commissionLedgerSchema.index({ idempotencyKey: 1 }, { unique: true });
commissionLedgerSchema.index(
  { shipmentId: 1, payerSide: 1, eventType: 1 },
  { unique: true, partialFilterExpression: { eventType: "ACCRUAL" } },
);

export const CommissionLedgerEvent = model("CommissionLedgerEvent", commissionLedgerSchema);
