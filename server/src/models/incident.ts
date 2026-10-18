import { Schema, model, type InferSchemaType, type Types } from "mongoose";
import { escalationStatuses, incidentActions, incidentStatuses, incidentTypes } from "../incidents/policy.js";

const incidentSchema = new Schema(
  {
    shipmentId: { type: Schema.Types.ObjectId, ref: "Shipment", required: true, index: true },
    shipperId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    incidentType: { type: String, required: true, enum: incidentTypes },
    title: { type: String, required: true, trim: true, maxlength: 120 },
    description: { type: String, required: true, trim: true, maxlength: 2000 },
    occurredAt: { type: Date },
    reportedAt: { type: Date, required: true },
    reporterId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    reporterRole: { type: String, required: true, enum: ["SHIPPER", "CARRIER", "DRIVER"] },
    carrierId: { type: Schema.Types.ObjectId, ref: "User", index: true },
    handlerId: { type: Schema.Types.ObjectId, ref: "User", default: null, index: true },
    status: { type: String, required: true, enum: incidentStatuses, index: true },
    escalationStatus: { type: String, required: true, enum: escalationStatuses, default: "NONE" },
    priority: { type: String, default: null },
    attachments: { type: [String], default: [] },
    version: { type: Number, required: true, default: 1 },
    resolutionSummary: { type: String, maxlength: 2000 },
    resolvedAt: { type: Date },
    resolvedBy: { type: Schema.Types.ObjectId, ref: "User" },
    objectionReason: { type: String, maxlength: 2000 },
    objectedAt: { type: Date },
    objectedBy: { type: Schema.Types.ObjectId, ref: "User" },
    idempotencyKey: { type: String, required: true },
    appliedKeys: { type: [String], default: [] },
    pendingEvents: {
      type: [
        new Schema(
          {
            idempotencyKey: { type: String, required: true },
            action: { type: String, required: true, enum: incidentActions },
            actorId: { type: Schema.Types.ObjectId, required: true },
            actorRole: { type: String, required: true, enum: ["SHIPPER", "CARRIER", "DRIVER", "ADMIN"] },
            statusBefore: { type: String, required: true, enum: incidentStatuses },
            statusAfter: { type: String, required: true, enum: incidentStatuses },
            note: { type: String, maxlength: 2000 },
            correlationId: { type: String, required: true, maxlength: 80 },
          },
          { _id: false },
        ),
      ],
      default: [],
    },
  },
  { timestamps: true },
);

incidentSchema.index({ reporterId: 1, idempotencyKey: 1 }, { unique: true });
incidentSchema.index({ shipperId: 1, updatedAt: -1, _id: -1 });
incidentSchema.index({ carrierId: 1, status: 1, updatedAt: -1 });
incidentSchema.index({ shipmentId: 1, createdAt: -1 });
incidentSchema.index({ status: 1, createdAt: -1 });
incidentSchema.index({ handlerId: 1, updatedAt: -1, _id: -1 });

export type IncidentRecord = InferSchemaType<typeof incidentSchema> & {
  _id: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
};

export const Incident = model("Incident", incidentSchema);
