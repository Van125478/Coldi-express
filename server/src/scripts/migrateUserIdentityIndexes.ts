import "dotenv/config";
import mongoose from "mongoose";
import { connectDatabase, disconnectDatabase } from "../config/database.js";
import { getEnv } from "../config/env.js";
import { User } from "../models/user.js";
import { userIndexMigrationAllowed } from "./demoSeedGuard.js";

const env = getEnv();
const databaseName = decodeURIComponent(new URL(env.MONGODB_URI.replace(/^mongodb(\+srv)?:\/\//, "https://")).pathname.replace(/^\//, "").split("/")[0] ?? "");
const allowed = userIndexMigrationAllowed(
  databaseName,
  env.NODE_ENV,
  process.env.USER_INDEX_MIGRATION_CONFIRM?.trim() ?? "",
  process.env.USER_INDEX_MIGRATION_ALLOW_PRODUCTION?.trim() ?? "",
);
if (!allowed) {
  console.error(`Refusing user index migration for database ${databaseName}. Set USER_INDEX_MIGRATION_CONFIRM to that exact database name. Production also requires USER_INDEX_MIGRATION_ALLOW_PRODUCTION=yes.`);
  process.exit(1);
}

const connected = await connectDatabase(env.MONGODB_URI);
if (!connected) {
  console.error("User index migration did not run because MongoDB is unavailable.");
  process.exit(1);
}
if (mongoose.connection.name !== databaseName) {
  console.error(`Refusing user index migration. Connected database ${mongoose.connection.name} does not match ${databaseName}.`);
  await disconnectDatabase();
  process.exit(1);
}

try {
  await User.syncIndexes();
  console.log(`Synchronized sparse unique email and username indexes on ${databaseName}. No user documents or password hashes were modified.`);
} finally {
  await disconnectDatabase();
}
