import { Schema, model } from "mongoose";

export const cargoContentTypes = ["image/jpeg", "image/png", "image/webp"] as const;

export type CargoContentType = (typeof cargoContentTypes)[number];

const cargoImageSchema = new Schema(
  {
    ownerId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    shipmentId: { type: Schema.Types.ObjectId, ref: "Shipment", default: null },
    contentType: { type: String, required: true, enum: cargoContentTypes },
    sizeBytes: { type: Number, required: true },
    storageKey: { type: String, required: true, unique: true },
    reservation: { type: String, default: null },
  },
  { timestamps: true, versionKey: false },
);

export const CargoImage = model("CargoImage", cargoImageSchema);
