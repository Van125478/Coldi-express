import { Schema, model } from "mongoose";
import { cargoContentTypes } from "./cargoImage.js";

const incidentEvidenceSchema = new Schema(
  {
    ownerId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    incidentId: { type: Schema.Types.ObjectId, ref: "Incident", default: null },
    contentType: { type: String, required: true, enum: cargoContentTypes },
    sizeBytes: { type: Number, required: true },
    storageKey: { type: String, required: true, unique: true },
  },
  { timestamps: true, versionKey: false },
);

export const IncidentEvidence = model("IncidentEvidence", incidentEvidenceSchema);
