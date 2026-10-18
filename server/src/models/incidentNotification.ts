import { Schema, model, type InferSchemaType, type Types } from "mongoose";
import { incidentActions } from "../incidents/policy.js";

const incidentNotificationSchema = new Schema(
  {
    recipientId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    incidentId: { type: Schema.Types.ObjectId, ref: "Incident", required: true },
    eventId: { type: Schema.Types.ObjectId, ref: "IncidentEvent", required: true },
    eventType: { type: String, required: true, enum: incidentActions },
    label: { type: String, required: true, maxlength: 160 },
    readAt: { type: Date, default: null },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

incidentNotificationSchema.index({ eventId: 1, recipientId: 1 }, { unique: true });
incidentNotificationSchema.index({ recipientId: 1, createdAt: -1, _id: -1 });

export type IncidentNotificationRecord = InferSchemaType<typeof incidentNotificationSchema> & {
  _id: Types.ObjectId;
  createdAt: Date;
};

export const IncidentNotification = model("IncidentNotification", incidentNotificationSchema);
