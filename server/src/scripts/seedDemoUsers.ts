import "dotenv/config";
import mongoose from "mongoose";
import { hashPassword } from "../auth/password.js";
import { connectDatabase, disconnectDatabase } from "../config/database.js";
import { getEnv } from "../config/env.js";
import { User, userRoles, type UserRole } from "../models/user.js";
import { demoSeedDecision } from "./demoSeedGuard.js";

const accounts: readonly { role: UserRole; emailKey: string; passwordKey: string; displayName: string }[] = [
  { role: "SHIPPER", emailKey: "DEMO_SHIPPER_EMAIL", passwordKey: "DEMO_SHIPPER_PASSWORD", displayName: "Chủ hàng demo" },
  { role: "CARRIER", emailKey: "DEMO_CARRIER_EMAIL", passwordKey: "DEMO_CARRIER_PASSWORD", displayName: "Nhà xe demo" },
  { role: "DRIVER", emailKey: "DEMO_DRIVER_EMAIL", passwordKey: "DEMO_DRIVER_PASSWORD", displayName: "Tài xế demo" },
  { role: "ADMIN", emailKey: "DEMO_ADMIN_EMAIL", passwordKey: "DEMO_ADMIN_PASSWORD", displayName: "Quản trị demo" },
];

function readEmail(emailKey: string): string {
  const email = process.env[emailKey]?.trim().toLowerCase() ?? "";
  if (email.length === 0 || !email.includes("@")) {
    throw new Error(`${emailKey} must be an email address.`);
  }
  return email;
}

function readPassword(passwordKey: string): string {
  const password = process.env[passwordKey] ?? "";
  if (password.length < 8 || password.length > 72) {
    throw new Error(`${passwordKey} must be 8 to 72 characters. Set it only in the local .env file.`);
  }
  return password;
}

const env = getEnv();
if (env.NODE_ENV === "production") {
  console.error("Demo account seeding is disabled in production.");
  process.exit(1);
}

const connected = await connectDatabase(env.MONGODB_URI);
if (!connected) {
  console.error("Demo accounts were not created because MongoDB is unavailable.");
  process.exit(1);
}

const databaseName = mongoose.connection.name;
const decision = demoSeedDecision(databaseName, {
  sync: process.env.DEMO_CREDENTIAL_SYNC,
  confirmedDatabase: process.env.DEMO_CREDENTIAL_SYNC_DATABASE,
});
if (decision === "refuse") {
  console.error(`Refusing to write demo accounts on database ${databaseName}.`);
  await disconnectDatabase();
  process.exit(1);
}

try {
  for (const account of accounts) {
    if (!userRoles.includes(account.role)) continue;
    const email = readEmail(account.emailKey);
    const existing = await User.findOne({ email }).select("role");
    if (existing && existing.role !== account.role) {
      throw new Error(`Refusing to change the role of existing account ${email}.`);
    }
    if (existing && decision !== "sync-passwords") {
      console.log(`Kept existing ${account.role} account ${email}. Password was not changed.`);
      continue;
    }
    const passwordHash = await hashPassword(readPassword(account.passwordKey));
    if (existing) {
      await User.updateOne({ _id: existing._id }, { $set: { passwordHash } });
      console.log(`Synchronized password for existing ${account.role} account ${email}.`);
      continue;
    }
    await User.create({
      email,
      passwordHash,
      role: account.role,
      displayName: account.displayName,
      accountStatus: "ACTIVE",
      mustChangePassword: false,
      sessionVersion: 0,
    });
    console.log(`Created demo ${account.role} account ${email}.`);
  }
} finally {
  await disconnectDatabase();
}
