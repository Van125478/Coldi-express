import { Schema, model, type InferSchemaType, type Types } from "mongoose";
import { dieselPriceKinds, dieselProduct } from "../market/diesel/policy.js";

const dieselPublicationSchema = new Schema(
  {
    product: { type: String, required: true, enum: [dieselProduct] },
    priceKind: { type: String, required: true, enum: dieselPriceKinds },
    priceVndPerLitre: { type: Number, required: true, min: 1, max: 99_999_999 },
    documentNumber: { type: String, required: true, trim: true, maxlength: 80 },
    sourceUrl: { type: String, required: true },
    announcedOn: { type: String, required: true },
    effectiveAt: { type: Date, required: true },
    verifiedAt: { type: Date, required: true },
    verifiedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    note: { type: String, maxlength: 2000, default: "" },
    superseded: { type: Boolean, required: true, default: false },
  },
  { timestamps: true },
);

dieselPublicationSchema.index({ product: 1, superseded: 1, verifiedAt: -1, _id: -1 });
dieselPublicationSchema.index({ documentNumber: 1, priceKind: 1, superseded: 1 });

export type DieselPublicationRecord = InferSchemaType<typeof dieselPublicationSchema> & {
  _id: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
};

export const DieselPublication = model("DieselPublication", dieselPublicationSchema);
