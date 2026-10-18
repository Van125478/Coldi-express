import { Schema, model } from "mongoose";
import { planAudiences, billingCycles } from "../packages/catalog.js";

const immutableVersionMessage = "Published plan versions are immutable.";

const planDefinitionSchema = new Schema(
  {
    code: { type: String, required: true, unique: true },
    audience: { type: String, required: true, enum: planAudiences },
    name: { type: String, required: true },
    billingCycle: { type: String, required: true, enum: billingCycles },
    contractRequired: { type: Boolean, required: true },
  },
  { versionKey: false },
);

const planVersionSchema = new Schema(
  {
    planCode: { type: String, required: true },
    revision: { type: Number, required: true },
    priceVnd: { type: Number, default: null },
    rateBps: { type: Number, default: null },
    vehicleCap: { type: Number, default: null },
    rateMinBps: { type: Number, default: null },
    rateMaxBps: { type: Number, default: null },
    contractRequired: { type: Boolean, required: true },
    status: { type: String, required: true, enum: ["PUBLISHED"] },
    effectiveFrom: { type: Date, required: true },
  },
  { versionKey: false },
);

planVersionSchema.index({ planCode: 1, revision: 1 }, { unique: true });

planVersionSchema.pre("save", function rejectPlanVersionSave() {
  if (!this.isNew) throw new Error(immutableVersionMessage);
});

function rejectPlanVersionMutation() {
  throw new Error(immutableVersionMessage);
}

planVersionSchema.pre("updateOne", rejectPlanVersionMutation);
planVersionSchema.pre("updateMany", rejectPlanVersionMutation);
planVersionSchema.pre("findOneAndUpdate", rejectPlanVersionMutation);
planVersionSchema.pre("findOneAndReplace", rejectPlanVersionMutation);
planVersionSchema.pre("replaceOne", rejectPlanVersionMutation);
planVersionSchema.pre("deleteOne", rejectPlanVersionMutation);
planVersionSchema.pre("deleteMany", rejectPlanVersionMutation);

const contractTermsSchema = new Schema(
  {
    accountId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    planCode: { type: String, required: true },
    priceVnd: { type: Number, required: true },
    rateBps: { type: Number, required: true },
    vehicleCap: { type: Number, default: null },
  },
  { timestamps: { createdAt: true, updatedAt: false }, versionKey: false },
);

const accountSubscriptionSchema = new Schema(
  {
    accountId: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    role: { type: String, required: true, enum: planAudiences },
    planCode: { type: String, required: true },
    planVersionId: { type: Schema.Types.ObjectId, ref: "PlanVersion", required: true },
    priceVnd: { type: Number, required: true },
    rateBps: { type: Number, required: true },
    vehicleCap: { type: Number, default: null },
    billingCycle: { type: String, required: true, enum: billingCycles },
    startAt: { type: Date, required: true },
    endAt: { type: Date, required: true },
    activationSource: { type: String, required: true, enum: ["DEMO_QA"] },
    environmentId: { type: String, required: true },
    contractTermsId: { type: Schema.Types.ObjectId, ref: "ContractTerms" },
    downgradeToFreeAt: { type: Date, default: null },
    revision: { type: Number, required: true },
    lastIdempotencyKey: { type: String, default: null },
    audits: {
      type: [
        new Schema(
          {
            action: { type: String, required: true, enum: ["DEMO_ACTIVATED", "DOWNGRADE_SCHEDULED"] },
            idempotencyKey: { type: String, required: true },
            actorId: { type: Schema.Types.ObjectId, ref: "User", required: true },
            actorRole: { type: String, required: true },
            planCode: { type: String, required: true },
            planVersionId: { type: Schema.Types.ObjectId, ref: "PlanVersion" },
            activationSource: { type: String, required: true, enum: ["DEMO_QA", "SCHEDULED_DOWNGRADE"] },
            paymentCollected: { type: Boolean, required: true },
            recordedAt: { type: Date, required: true },
          },
          { _id: false },
        ),
      ],
      default: [],
    },
  },
  { versionKey: false },
);

const planAuditEventSchema = new Schema(
  {
    accountId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    actorId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    actorRole: { type: String, required: true },
    action: { type: String, required: true, enum: ["DEMO_ACTIVATED", "DOWNGRADE_SCHEDULED"] },
    idempotencyKey: { type: String, required: true },
    planCode: { type: String, required: true },
    planVersionId: { type: Schema.Types.ObjectId, ref: "PlanVersion" },
    activationSource: { type: String, required: true, enum: ["DEMO_QA", "SCHEDULED_DOWNGRADE"] },
    paymentCollected: { type: Boolean, required: true, default: false },
    recordedAt: { type: Date, required: true },
  },
  { versionKey: false },
);

planAuditEventSchema.index({ accountId: 1, idempotencyKey: 1 }, { unique: true });

const fleetHoldSchema = new Schema(
  {
    token: { type: String, required: true },
    createdAt: { type: Date, required: true },
  },
  { _id: false },
);

const fleetCapacitySchema = new Schema(
  {
    carrierId: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    activeCount: { type: Number, required: true, min: 0 },
    holds: { type: [fleetHoldSchema], default: [] },
  },
  { versionKey: false },
);

const demoContractGrantSchema = new Schema(
  {
    accountId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    planCode: { type: String, required: true },
    priceVnd: { type: Number, required: true },
    rateBps: { type: Number, required: true },
    vehicleCap: { type: Number, default: null },
    environmentId: { type: String, required: true },
    authorizedBy: { type: String, required: true, enum: ["QA_FIXTURE"] },
  },
  { timestamps: true, versionKey: false },
);

demoContractGrantSchema.index({ accountId: 1, planCode: 1, environmentId: 1 }, { unique: true });

export const PlanDefinition = model("PlanDefinition", planDefinitionSchema);
export const PlanVersion = model("PlanVersion", planVersionSchema);
export const ContractTerms = model("ContractTerms", contractTermsSchema);
export const AccountSubscription = model("AccountSubscription", accountSubscriptionSchema);
export const PlanAuditEvent = model("PlanAuditEvent", planAuditEventSchema);
export const FleetCapacity = model("FleetCapacity", fleetCapacitySchema);
export const DemoContractGrant = model("DemoContractGrant", demoContractGrantSchema);
