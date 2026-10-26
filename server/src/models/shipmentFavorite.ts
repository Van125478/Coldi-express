import { Schema, model } from "mongoose";

const shipmentFavoriteSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    shipmentId: { type: Schema.Types.ObjectId, ref: "Shipment", required: true },
  },
  { timestamps: true },
);

shipmentFavoriteSchema.index({ userId: 1, shipmentId: 1 }, { unique: true });
shipmentFavoriteSchema.index({ userId: 1, createdAt: -1 });

export const ShipmentFavorite = model("ShipmentFavorite", shipmentFavoriteSchema);
