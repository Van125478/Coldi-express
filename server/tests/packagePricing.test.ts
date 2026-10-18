import assert from "node:assert/strict";
import test, { after, before } from "node:test";
import mongoose from "mongoose";
import { hashPassword } from "../src/auth/password.js";
import { CommissionLedgerEvent } from "../src/models/commissionLedger.js";
import { AccountSubscription, FleetCapacity, PlanVersion } from "../src/models/package.js";
import { User } from "../src/models/user.js";
import { activateDemoPlan } from "../src/packages/activation.js";
import { publishPlanVersions } from "../src/packages/publishCatalog.js";

process.env.PORT ??= "4000";
process.env.FRONTEND_ORIGIN ??= "http://127.0.0.1:5173";
process.env.NODE_ENV = "test";
process.env.AUTH_SECRET ??= "test-secret-that-is-at-least-32-characters";
process.env.APP_RUNTIME_MODE = "qa";
process.env.PACKAGE_DEMO_SELF_ACTIVATION_ENABLED = "true";
process.env.PACKAGE_DEMO_DEPLOYMENT_ID = "qa-pricing-test";
process.env.PACKAGE_DEMO_AUTHORIZED_DEPLOYMENT_ID = "qa-pricing-test";

const databaseName = "coldi_package_pricing_test";
const forbidden = new Set(["coldi", "coldi_demo_local", "admin", "local", "config"]);
const sourceUri = process.env.MONGODB_URI ?? "mongodb://127.0.0.1:27017/coldi";
const testUri = new URL(sourceUri);
testUri.pathname = `/${databaseName}`;
process.env.MONGODB_URI = testUri.toString();

const historicalPrice = 2_500_000;
const historicalRate = 260;

before(async () => {
  process.env.MONGODB_URI = testUri.toString();
  await mongoose.connect(testUri.toString(), { serverSelectionTimeoutMS: 4000 });
  if (mongoose.connection.name !== databaseName || forbidden.has(mongoose.connection.name)) {
    throw new Error(`Refusing to use database ${mongoose.connection.name}.`);
  }
  await mongoose.connection.dropDatabase();
});

after(async () => {
  if (mongoose.connection.name === databaseName) await mongoose.connection.dropDatabase();
  await mongoose.disconnect();
});

test("a new published revision does not rewrite historical subscriptions or plan versions", async () => {
  process.env.MONGODB_URI = testUri.toString();
  const passwordHash = await hashPassword("test-password-123");
  const carrier = await User.create({ email: "carrier.pricing-test@coldi.local", passwordHash, role: "CARRIER", displayName: "Nhà xe cũ" });
  const shipper = await User.create({ email: "shipper.pricing-test@coldi.local", passwordHash, role: "SHIPPER", displayName: "Chủ hàng mới" });
  const legacyBusiness = await PlanVersion.create({
    planCode: "carrier-business",
    revision: 1,
    priceVnd: null,
    rateBps: null,
    rateMinBps: 250,
    rateMaxBps: 300,
    vehicleCap: 30,
    contractRequired: true,
    status: "PUBLISHED",
    effectiveFrom: new Date("2026-10-01T00:00:00.000Z"),
  });
  await PlanVersion.create({
    planCode: "shipper-enterprise",
    revision: 1,
    priceVnd: null,
    rateBps: null,
    rateMinBps: 200,
    rateMaxBps: 300,
    vehicleCap: null,
    contractRequired: true,
    status: "PUBLISHED",
    effectiveFrom: new Date("2026-10-01T00:00:00.000Z"),
  });
  const startAt = new Date("2026-10-01T00:00:00.000Z");
  const endAt = new Date("2026-11-01T00:00:00.000Z");
  await AccountSubscription.create({
    accountId: carrier._id,
    role: "CARRIER",
    planCode: "carrier-business",
    planVersionId: legacyBusiness._id,
    priceVnd: historicalPrice,
    rateBps: historicalRate,
    vehicleCap: 30,
    billingCycle: "MONTH",
    startAt,
    endAt,
    activationSource: "DEMO_QA",
    environmentId: "historical-contract",
    revision: 1,
    audits: [],
  });

  await publishPlanVersions();
  await publishPlanVersions();

  const legacyAfter = await PlanVersion.findById(legacyBusiness._id);
  assert.equal(legacyAfter?.priceVnd ?? null, null);
  assert.equal(legacyAfter?.rateBps ?? null, null);
  assert.equal(legacyAfter?.contractRequired, true);
  assert.equal(legacyAfter?.vehicleCap, 30);
  const businessRevisions = await PlanVersion.find({ planCode: "carrier-business" }).sort({ revision: 1 });
  assert.equal(businessRevisions.length, 2);
  assert.equal(businessRevisions[1]?.priceVnd, 2_990_000);
  assert.equal(businessRevisions[1]?.rateBps, 300);
  assert.equal(businessRevisions[1]?.vehicleCap, 30);
  assert.equal(businessRevisions[1]?.contractRequired, false);

  const historical = await AccountSubscription.findOne({ accountId: carrier._id });
  assert.equal(historical?.priceVnd, historicalPrice);
  assert.equal(historical?.rateBps, historicalRate);
  assert.equal(historical?.vehicleCap, 30);
  assert.equal(historical?.planVersionId.toString(), legacyBusiness.id);
  assert.equal(historical?.endAt.toISOString(), endAt.toISOString());

  const activated = await activateDemoPlan(shipper.id, "shipper-enterprise", "shipper-enterprise-new");
  assert.equal(activated.entitlements.priceVnd, 6_990_000);
  assert.equal(activated.entitlements.rateBps, 250);
  assert.equal(activated.entitlements.vehicleCap, null);
  assert.equal(activated.paymentCollected, false);
  const shipperSubscription = await AccountSubscription.findOne({ accountId: shipper._id });
  assert.equal(shipperSubscription?.vehicleCap ?? null, null);
  assert.equal(shipperSubscription?.priceVnd, 6_990_000);
  assert.equal(shipperSubscription?.rateBps, 250);
  const enterpriseRevision = await PlanVersion.findById(shipperSubscription?.planVersionId);
  assert.equal(enterpriseRevision?.revision, 2);
  assert.equal(enterpriseRevision?.priceVnd, 6_990_000);
  assert.equal(await FleetCapacity.countDocuments({ carrierId: shipper._id }), 0);
  assert.equal(await CommissionLedgerEvent.countDocuments(), 0);

  const historicalAfter = await AccountSubscription.findOne({ accountId: carrier._id });
  assert.equal(historicalAfter?.priceVnd, historicalPrice);
  assert.equal(historicalAfter?.rateBps, historicalRate);
  assert.equal(historicalAfter?.vehicleCap, 30);
  assert.equal(historicalAfter?.planVersionId.toString(), legacyBusiness.id);
});
