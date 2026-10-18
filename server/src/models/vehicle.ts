import { Schema, model } from "mongoose";
import { temperatureGroups } from "./shipment.js";

export const vehicleStatuses = ["ACTIVE", "ARCHIVED"] as const;

export type VehicleStatus = (typeof vehicleStatuses)[number];

export const vehicleKinds = ["REEFER_TRUCK", "REEFER_CONTAINER", "REEFER_VAN"] as const;

export type VehicleKind = (typeof vehicleKinds)[number];

export const vehicleKindLabels: Record<VehicleKind, string> = {
  REEFER_TRUCK: "Xe tải lạnh",
  REEFER_CONTAINER: "Container lạnh",
  REEFER_VAN: "Xe van lạnh",
};

const vehicleSchema = new Schema(
  {
    carrierId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    label: { type: String, required: true, trim: true, maxlength: 160 },
    plate: { type: String, trim: true, maxlength: 20 },
    vehicleKind: { type: String, enum: vehicleKinds },
    temperatureGroup: { type: String, enum: temperatureGroups },
    capacityTon: { type: Number },
    status: { type: String, enum: vehicleStatuses, default: "ACTIVE" },
    statusChangedAt: { type: Date },
    archivedAt: { type: Date },
    restoredAt: { type: Date },
    leasedShipmentIds: { type: [{ type: Schema.Types.ObjectId, ref: "Shipment" }], default: [] },
    leaseAcquiredAt: { type: Date },
  },
  { timestamps: true },
);

export const Vehicle = model("Vehicle", vehicleSchema);
