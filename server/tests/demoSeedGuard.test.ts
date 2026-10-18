import assert from "node:assert/strict";
import test from "node:test";
import { demoSeedDecision, userIndexMigrationAllowed } from "../src/scripts/demoSeedGuard.js";

test("demo seeding never writes the protected coldi database and keeps existing passwords unless sync is confirmed", () => {
  assert.equal(demoSeedDecision("coldi", { sync: "confirm", confirmedDatabase: "coldi" }), "refuse");
  assert.equal(demoSeedDecision("coldi_demo_local", {}), "refuse");
  assert.equal(demoSeedDecision("coldi_demo_local", { sync: "confirm", confirmedDatabase: "other" }), "refuse");
  assert.equal(demoSeedDecision("coldi_demo_local", { confirmedDatabase: "coldi_demo_local" }), "create-or-keep");
  assert.equal(demoSeedDecision("coldi_demo_local", { sync: "confirm", confirmedDatabase: "coldi_demo_local" }), "sync-passwords");
  assert.equal(demoSeedDecision("coldi_seed_guard_test", { sync: "confirm" }), "refuse");
  assert.equal(demoSeedDecision("coldi_seed_guard_test", {}), "create-or-keep");
});

test("user identity index migration requires the exact database name and does not run from a query or header", () => {
  assert.equal(userIndexMigrationAllowed("coldi", "development", "", ""), false);
  assert.equal(userIndexMigrationAllowed("coldi_demo_local", "development", "coldi", ""), false);
  assert.equal(userIndexMigrationAllowed("coldi_demo_local", "development", "coldi_demo_local", ""), true);
  assert.equal(userIndexMigrationAllowed("coldi", "production", "coldi", ""), false);
  assert.equal(userIndexMigrationAllowed("coldi", "production", "coldi", "yes"), true);
  assert.equal(userIndexMigrationAllowed("", "development", "", ""), false);
});
