import mongoose from "mongoose";
import { User } from "../models/user.js";

const protectedDatabases = new Set(["coldi", "admin", "local", "config"]);

export class IdentityMigrationRefused extends Error {
  constructor(message: string) {
    super(message);
    this.name = "IdentityMigrationRefused";
  }
}

type SavedIndex = {
  name: string;
  key: Record<string, 1 | -1>;
  unique?: boolean;
  sparse?: boolean;
};

/** Aligns user indexes with the sparse unique email and username model. Documents and password hashes are not written. */
export async function migrateUserIdentityIndexes(): Promise<void> {
  const databaseName = mongoose.connection.name;
  if (protectedDatabases.has(databaseName)) {
    throw new IdentityMigrationRefused(`Refusing user index migration for protected database ${databaseName}. No index was changed.`);
  }
  const emailGroups = await duplicateGroups("email");
  const usernameGroups = await duplicateGroups("username");
  if (emailGroups > 0 || usernameGroups > 0) {
    throw new IdentityMigrationRefused(
      `Refusing user index migration for ${databaseName}: found ${emailGroups} duplicate email groups and ${usernameGroups} duplicate username groups. No index was changed.`,
    );
  }
  const before = await savedIndexes();
  try {
    await User.syncIndexes();
  } catch (error) {
    await restoreMissingIndexes(before);
    throw error;
  }
  const after = await User.collection.indexes();
  const email = after.find((index) => index.name === "email_1");
  const username = after.find((index) => index.name === "username_1");
  if (email?.unique !== true || email.sparse !== true || username?.unique !== true || username.sparse !== true) {
    await restoreMissingIndexes(before);
    throw new IdentityMigrationRefused("User identity indexes are not sparse unique after migration. Previous indexes were restored where possible.");
  }
}

async function duplicateGroups(field: "email" | "username"): Promise<number> {
  const rows = await User.aggregate<{ n: number }>([
    { $match: { [field]: { $type: "string" } } },
    { $group: { _id: `$${field}`, n: { $sum: 1 } } },
    { $match: { n: { $gt: 1 } } },
    { $count: "n" },
  ]);
  return rows[0]?.n ?? 0;
}

async function savedIndexes(): Promise<SavedIndex[]> {
  const indexes = await User.collection.indexes();
  return indexes.flatMap((index) => {
    if (!index.name || index.name === "_id_" || !index.key) return [];
    return [
      {
        name: index.name,
        key: index.key as Record<string, 1 | -1>,
        ...(index.unique === true ? { unique: true } : {}),
        ...(index.sparse === true ? { sparse: true } : {}),
      },
    ];
  });
}

async function restoreMissingIndexes(before: SavedIndex[]): Promise<void> {
  const current = new Set((await User.collection.indexes()).map((index) => index.name));
  for (const index of before) {
    if (current.has(index.name)) continue;
    await User.collection.createIndex(index.key, {
      name: index.name,
      ...(index.unique ? { unique: true } : {}),
      ...(index.sparse ? { sparse: true } : {}),
    });
  }
}
