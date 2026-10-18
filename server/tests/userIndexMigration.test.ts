import assert from "node:assert/strict";
import test, { after, before } from "node:test";
import mongoose from "mongoose";
import { User } from "../src/models/user.js";
import { IdentityMigrationRefused, migrateUserIdentityIndexes } from "../src/scripts/userIndexMigration.js";

mongoose.set("autoIndex", false);

const sourceUri = process.env.MONGODB_URI ?? "mongodb://127.0.0.1:27017/coldi";
const testUri = new URL(sourceUri);
testUri.pathname = "/coldi_identity_migration_test";

before(async () => {
  await mongoose.connect(testUri.toString());
  if (mongoose.connection.name !== "coldi_identity_migration_test") {
    throw new Error(`Refusing to use database ${mongoose.connection.name}.`);
  }
  await mongoose.connection.dropDatabase();
});

after(async () => {
  if (mongoose.connection.name === "coldi_identity_migration_test") await mongoose.connection.dropDatabase();
  await mongoose.disconnect();
});

test("legacy non-sparse email index becomes sparse unique without rewriting users", async () => {
  const users = mongoose.connection.collection("users");
  await users.drop().catch(() => undefined);
  await users.createIndex({ email: 1 }, { unique: true, name: "email_1" });
  const hash = "stored-hash-not-rewritten";
  await User.collection.insertOne({ email: "legacy@example.com", passwordHash: hash, role: "CARRIER", displayName: "Legacy carrier" });
  await User.collection.insertOne({ passwordHash: hash, role: "DRIVER", displayName: "First driver", username: "driver.one" });
  await assert.rejects(
    User.collection.insertOne({ passwordHash: hash, role: "DRIVER", displayName: "Second driver", username: "driver.two" }),
  );

  await migrateUserIdentityIndexes();
  await User.collection.insertOne({ passwordHash: hash, role: "DRIVER", displayName: "Second driver", username: "driver.two" });
  await assert.rejects(
    User.collection.insertOne({ email: "legacy@example.com", passwordHash: "other-hash", role: "CARRIER", displayName: "Duplicate" }),
  );
  await assert.rejects(
    User.collection.insertOne({ passwordHash: hash, role: "DRIVER", displayName: "Copied", username: "driver.one" }),
  );

  const saved = await User.collection.findOne({ email: "legacy@example.com" });
  assert.equal(saved?.passwordHash, hash);
  assert.equal(saved?.displayName, "Legacy carrier");
  const indexes = await User.collection.indexes();
  const email = indexes.find((index) => index.name === "email_1");
  const username = indexes.find((index) => index.name === "username_1");
  assert.equal(email?.unique, true);
  assert.equal(email?.sparse, true);
  assert.equal(username?.unique, true);
  assert.equal(username?.sparse, true);

  await migrateUserIdentityIndexes();
  assert.equal((await User.collection.findOne({ email: "legacy@example.com" }))?.passwordHash, hash);
});

test("duplicate identity values abort before any index change", async () => {
  await User.collection.drop().catch(() => undefined);
  await User.collection.insertMany([
    { email: "same@example.com", username: "shared", passwordHash: "hash-a", role: "DRIVER", displayName: "A" },
    { email: "same@example.com", username: "shared", passwordHash: "hash-b", role: "DRIVER", displayName: "B" },
  ]);
  const before = await User.collection.indexes();

  await assert.rejects(() => migrateUserIdentityIndexes(), IdentityMigrationRefused);

  const after = await User.collection.indexes();
  assert.deepEqual(after.map((index) => index.name), before.map((index) => index.name));
  const hashes = (await User.collection.find().sort({ passwordHash: 1 }).toArray()).map((user) => user.passwordHash);
  assert.deepEqual(hashes, ["hash-a", "hash-b"]);
});
