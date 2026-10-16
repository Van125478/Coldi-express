import { Schema, model } from "mongoose";

export const userRoles = ["SHIPPER", "CARRIER", "DRIVER", "ADMIN"] as const;

export type UserRole = (typeof userRoles)[number];

const userSchema = new Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    role: { type: String, required: true, enum: userRoles },
  },
  { timestamps: true },
);

export const User = model("User", userSchema);
