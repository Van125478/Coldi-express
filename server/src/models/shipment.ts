import { Schema, model } from "mongoose";

export const temperatureGroups = ["COOL", "FROZEN", "DEEP_FROZEN"] as const;

export type TemperatureGroup = (typeof temperatureGroups)[number];

export const temperatureLabels: Record<TemperatureGroup, string> = {
  COOL: "Lạnh mát",
  FROZEN: "Đông",
  DEEP_FROZEN: "Cực lạnh",
};

export const shipmentStatuses = [
  "DRAFT",
  "PUBLISHED",
  "MATCHED",
  "PICKUP_CONFIRMED",
  "IN_TRANSIT",
  "DELIVERY_CONFIRMED",
  "COMPLETED",
  "INCIDENT",
  "CANCELLED",
] as const;

export type ShipmentStatus = (typeof shipmentStatuses)[number];

const shipmentSchema = new Schema(
  {
    shipperId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    cargoDescription: { type: String, required: true, trim: true },
    pickupLocation: { type: String, required: true, trim: true },
    pickupCompany: { type: String, trim: true, maxlength: 160 },
    pickupContactName: { type: String, trim: true, maxlength: 160 },
    pickupPhone: { type: String, trim: true, maxlength: 20 },
    pickupEmail: { type: String, trim: true, maxlength: 160 },
    pickupDate: { type: String, trim: true, maxlength: 10 },
    pickupTimeFrom: { type: String, trim: true, maxlength: 5 },
    pickupTimeTo: { type: String, trim: true, maxlength: 5 },
    deliveryLocation: { type: String, required: true, trim: true },
    deliveryCompany: { type: String, trim: true, maxlength: 160 },
    deliveryContactName: { type: String, trim: true, maxlength: 160 },
    deliveryPhone: { type: String, trim: true, maxlength: 20 },
    deliveryEmail: { type: String, trim: true, maxlength: 160 },
    deliveryDate: { type: String, trim: true, maxlength: 10 },
    deliveryTimeFrom: { type: String, trim: true, maxlength: 5 },
    deliveryTimeTo: { type: String, trim: true, maxlength: 5 },
    cargoWeightTon: { type: Number },
    cargoVolumeM3: { type: Number },
    packageCount: { type: Number },
    temperatureGroup: { type: String, required: true, enum: temperatureGroups },
    vehicleRequirement: { type: String, required: true, trim: true },
    listedPriceVnd: { type: Number, required: true },
    status: { type: String, required: true, enum: shipmentStatuses },
    carrierId: { type: Schema.Types.ObjectId, ref: "User" },
    vehicleId: { type: Schema.Types.ObjectId, ref: "Vehicle" },
    driverId: { type: Schema.Types.ObjectId, ref: "User" },
    pickupConfirmedAt: { type: Date },
    pickupConfirmedBy: { type: Schema.Types.ObjectId, ref: "User" },
    deliveryConfirmedAt: { type: Date },
    deliveryConfirmedBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true },
);

export const Shipment = model("Shipment", shipmentSchema);
