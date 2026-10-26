import { Schema, model } from "mongoose";

const shipmentReviewSchema = new Schema(
  {
    shipmentId: { type: Schema.Types.ObjectId, ref: "Shipment", required: true },
    shipperId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    carrierId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    stars: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, required: true, trim: true, maxlength: 500 },
  },
  { timestamps: true },
);

shipmentReviewSchema.index({ shipmentId: 1 }, { unique: true });

export const ShipmentReview = model("ShipmentReview", shipmentReviewSchema);
