import { Schema, model, type InferSchemaType, type Types } from "mongoose";
import { escalationStatuses, incidentActions, incidentStatuses } from "../incidents/policy.js";

const incidentEventSchema = new Schema(
  {
    incidentId: { type: Schema.Types.ObjectId, ref: "Incident", required: true, index: true },
    action: { type: String, required: true, enum: incidentActions },
    actorId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
      required: function (this: { actorRole?: string }) {
        return this.actorRole !== "SYSTEM";
      },
    },
    actorRole: { type: String, required: true, enum: ["SHIPPER", "CARRIER", "DRIVER", "ADMIN", "SYSTEM"] },
    occurredAt: { type: Date, required: true },
    statusBefore: { type: String, required: true, enum: incidentStatuses },
    statusAfter: { type: String, required: true, enum: incidentStatuses },
    escalationBefore: { type: String, required: true, enum: escalationStatuses },
    escalationAfter: { type: String, required: true, enum: escalationStatuses },
    note: { type: String, maxlength: 2000 },
    idempotencyKey: { type: String, required: true },
    correlationId: { type: String, required: true, maxlength: 80 },
    visibility: { type: String, required: true, enum: ["PARTICIPANT", "INTERNAL"], default: "PARTICIPANT" },
  },
  { timestamps: false },
);

incidentEventSchema.index({ incidentId: 1, idempotencyKey: 1 }, { unique: true });
incidentEventSchema.index({ incidentId: 1, occurredAt: 1, _id: 1 });

export type IncidentEventRecord = InferSchemaType<typeof incidentEventSchema> & { _id: Types.ObjectId };

export const IncidentEvent = model("IncidentEvent", incidentEventSchema);
