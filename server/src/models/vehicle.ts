import { Schema, model } from "mongoose";

const vehicleSchema = new Schema(
  {
    carrierId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    label: { type: String, required: true, trim: true, maxlength: 160 },
  },
  { timestamps: true },
);

export const Vehicle = model("Vehicle", vehicleSchema);
