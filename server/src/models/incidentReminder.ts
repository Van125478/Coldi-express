import { Schema, model } from "mongoose";
import { reminderKinds } from "../incidents/policy.js";

const incidentReminderPolicySchema = new Schema(
  {
    kind: { type: String, required: true, enum: reminderKinds, unique: true },
    enabled: { type: Boolean, required: true, default: false },
    intervalMinutes: { type: Number, default: null },
  },
  { timestamps: true },
);

export const IncidentReminderPolicy = model("IncidentReminderPolicy", incidentReminderPolicySchema);
