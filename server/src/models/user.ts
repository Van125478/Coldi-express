import { Schema, model } from "mongoose";

export const userRoles = ["SHIPPER", "CARRIER", "DRIVER", "ADMIN"] as const;

export type UserRole = (typeof userRoles)[number];

export const accountStatuses = ["ACTIVE", "LOCKED"] as const;

export type AccountStatus = (typeof accountStatuses)[number];

const userSchema = new Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    role: { type: String, required: true, enum: userRoles },
    carrierId: { type: Schema.Types.ObjectId, ref: "User", index: true },
    displayName: { type: String, trim: true, maxlength: 80 },
    accountStatus: { type: String, enum: accountStatuses, default: "ACTIVE" },
    mustChangePassword: { type: Boolean, default: false },
    sessionVersion: { type: Number, default: 0 },
    heldShipmentIds: [{ type: Schema.Types.ObjectId, ref: "Shipment" }],
  },
  { timestamps: true },
);

export const User = model("User", userSchema);
