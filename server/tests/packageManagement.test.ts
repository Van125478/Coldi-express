import assert from "node:assert/strict";
import { createServer } from "node:http";
import { once } from "node:events";
import test, { before, after } from "node:test";
import mongoose from "mongoose";
import { hashPassword } from "../src/auth/password.js";
import { AccountSubscription, FleetCapacity, PlanAuditEvent, PlanVersion, ContractTerms } from "../src/models/package.js";
import { Shipment } from "../src/models/shipment.js";
import { User } from "../src/models/user.js";
import { Vehicle } from "../src/models/vehicle.js";

process.env.PORT ??= "4000";
process.env.FRONTEND_ORIGIN ??= "http://127.0.0.1:5173";
process.env.NODE_ENV = "test";
process.env.AUTH_SECRET ??= "test-secret-that-is-at-least-32-characters";
process.env.APP_RUNTIME_MODE = "qa";
process.env.PACKAGE_DEMO_SELF_ACTIVATION_ENABLED = "true";
process.env.PACKAGE_DEMO_DEPLOYMENT_ID = "qa-package-test";
process.env.PACKAGE_DEMO_AUTHORIZED_DEPLOYMENT_ID = "qa-package-test";

const sourceUri = process.env.MONGODB_URI ?? "mongodb://127.0.0.1:27017/coldi";
const testUri = new URL(sourceUri);
testUri.pathname = "/coldi_package_test";
process.env.MONGODB_URI = testUri.toString();

const { createApp } = await import("../src/app.js");

const password = "test-password-123";
const databaseName = "coldi_package_test";
const forbidden = new Set(["coldi", "admin", "local", "config"]);
const shipperEmail = "shipper.package-test@coldi.local";
const carrierEmail = "carrier.package-test@coldi.local";
const otherCarrierEmail = "other.package-test@coldi.local";
const driverEmail = "driver.package-test@coldi.local";
const adminEmail = "admin.package-test@coldi.local";
const vehicleBody = {
  label: "Xe lạnh gói",
  plate: "51C-100.01",
  vehicleKind: "REEFER_TRUCK",
  temperatureGroup: "FROZEN",
  capacityTon: 5,
};

type Json = Record<string, unknown>;
let carrierId = "";
let otherCarrierId = "";
let driverId = "";

async function withServer(run: (baseUrl: string) => Promise<void>) {
  const server = createServer(createApp());
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  const address = server.address();
  if (address === null || typeof address === "string") throw new Error("Test server did not bind.");
  try {
    await run(`http://127.0.0.1:${address.port}`);
  } finally {
    server.close();
    await once(server, "close");
  }
}

async function login(baseUrl: string, email: string): Promise<string> {
  const response = await fetch(`${baseUrl}/api/auth/login`, {
    method: "POST",
    headers: { "content-type": "application/json", origin: "http://127.0.0.1:5173" },
    body: JSON.stringify({ email, password }),
  });
  assert.equal(response.status, 200);
  const cookie = response.headers.getSetCookie().find((value) => value.startsWith("coldi_session="));
  assert.ok(cookie);
  return cookie.split(";")[0] ?? "";
}

function headers(cookie: string, json = false): Record<string, string> {
  return {
    origin: "http://127.0.0.1:5173",
    cookie,
    ...(json ? { "content-type": "application/json" } : {}),
  };
}

async function publish(baseUrl: string, cookie: string) {
  const response = await fetch(`${baseUrl}/api/shipments`, {
    method: "POST",
    headers: headers(cookie, true),
    body: JSON.stringify({
      cargoDescription: "Hàng kiểm tra gói",
      pickupLocation: "Cái Bè, Tiền Giang",
      deliveryLocation: "Thủ Đức, TP. Hồ Chí Minh",
      temperatureGroup: "FROZEN",
      vehicleRequirement: "Xe đông lạnh 5 tấn",
      listedPriceVnd: 5000000,
      pickupCompany: "Kho kiểm tra",
      pickupContactName: "Người lấy",
      pickupPhone: "0908123456",
      pickupDate: "2026-10-22",
      pickupTimeFrom: "08:00",
      pickupTimeTo: "11:30",
      deliveryCompany: "Kho giao",
      deliveryContactName: "Người nhận",
      deliveryPhone: "0912889999",
      deliveryDate: "2026-10-23",
      deliveryTimeFrom: "14:00",
      deliveryTimeTo: "18:00",
      cargoWeightTon: 2,
      cargoVolumeM3: 8,
      packageCount: 10,
    }),
  });
  assert.equal(response.status, 201);
  return ((await response.json()) as Json).shipment as Json;
}

async function resetDisposable() {
  assert.equal(mongoose.connection.name, databaseName);
  if (forbidden.has(mongoose.connection.name)) throw new Error("Refusing to clean a protected database.");
  await Promise.all([
    Vehicle.deleteMany({}),
    FleetCapacity.deleteMany({}),
    AccountSubscription.deleteMany({}),
    PlanAuditEvent.deleteMany({}),
    ContractTerms.deleteMany({}),
    Shipment.deleteMany({}),
  ]);
}

async function addVehicles(ownerId: string, count: number) {
  if (count === 0) return;
  await Vehicle.insertMany(Array.from({ length: count }, (_, index) => ({ carrierId: ownerId, label: `Xe sẵn ${index + 1}`, status: "ACTIVE" })));
}

before(async () => {
  await mongoose.connect(process.env.MONGODB_URI ?? "", { serverSelectionTimeoutMS: 4000 });
  if (mongoose.connection.name !== databaseName || forbidden.has(mongoose.connection.name)) {
    throw new Error(`Refusing to use database ${mongoose.connection.name}.`);
  }
  await mongoose.connection.dropDatabase();
  const passwordHash = await hashPassword(password);
  const carrier = await User.create({ email: carrierEmail, passwordHash, role: "CARRIER", displayName: "Nhà xe gói" });
  const other = await User.create({ email: otherCarrierEmail, passwordHash, role: "CARRIER", displayName: "Nhà xe khác" });
  await User.create({ email: shipperEmail, passwordHash, role: "SHIPPER", displayName: "Chủ hàng gói" });
  const driver = await User.create({ email: driverEmail, passwordHash, role: "DRIVER", carrierId: carrier._id, displayName: "Tài xế gói" });
  await User.create({ email: adminEmail, passwordHash, role: "ADMIN", displayName: "Quản trị gói" });
  carrierId = carrier.id;
  otherCarrierId = other.id;
  driverId = driver.id;
});

after(async () => {
  if (mongoose.connection.name === databaseName) await mongoose.connection.dropDatabase();
  await mongoose.disconnect();
});

test("catalog publishes fixed prices and leaves contract tiers as quotes", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/packages/catalog`);
    assert.equal(response.status, 200);
    const plans = ((await response.json()) as Json).plans as Json[];
    assert.equal(plans.filter((plan) => plan.audience === "SHIPPER").length, 4);
    assert.equal(plans.filter((plan) => plan.audience === "CARRIER").length, 5);
    const monthly = plans.find((plan) => plan.code === "shipper-pro-monthly");
    assert.equal(monthly?.priceVnd, 799000);
    assert.equal(monthly?.rateBps, 400);
    const carrierFree = plans.find((plan) => plan.code === "carrier-free");
    assert.equal(carrierFree?.vehicleCap, 2);
    assert.equal(carrierFree?.rateBps, 500);
    const enterprise = plans.find((plan) => plan.code === "carrier-enterprise");
    assert.equal(enterprise?.priceVnd, null);
    assert.equal(enterprise?.rateBps, null);
    assert.equal(enterprise?.quoteRequired, true);
    assert.equal(enterprise?.listPriceLabel, "Liên hệ báo giá");
    const business = plans.find((plan) => plan.code === "carrier-business");
    assert.equal(business?.vehicleCap, 30);
    assert.equal(business?.priceVnd, null);
  });
});

test("legacy accounts resolve to Free and only the account owner can activate", async () => {
  await resetDisposable();
  await withServer(async (baseUrl) => {
    const shipper = await login(baseUrl, shipperEmail);
    const carrier = await login(baseUrl, carrierEmail);
    const driver = await login(baseUrl, driverEmail);
    const admin = await login(baseUrl, adminEmail);
    const mine = await fetch(`${baseUrl}/api/packages/my-plan`, { headers: headers(shipper) });
    assert.equal(mine.status, 200);
    const body = (await mine.json()) as Json;
    const plan = body.plan as Json;
    assert.equal(plan.code, "shipper-free");
    assert.equal(plan.rateBps, 500);
    assert.equal(plan.paymentCollected, false);
    assert.equal(plan.activationSource, "IMPLICIT_FREE");
    assert.equal((await fetch(`${baseUrl}/api/packages/my-plan`, { headers: headers(driver) })).status, 403);
    assert.equal((await fetch(`${baseUrl}/api/packages/my-plan`, { headers: headers(admin) })).status, 403);
    const foreign = await fetch(`${baseUrl}/api/packages/my-plan/demo-activate`, {
      method: "POST",
      headers: headers(shipper, true),
      body: JSON.stringify({ planCode: "shipper-pro-monthly", idempotencyKey: "shipper-own-0001", accountId: carrierId }),
    });
    assert.equal(foreign.status, 400);
    const wrongRole = await fetch(`${baseUrl}/api/packages/my-plan/demo-activate`, {
      method: "POST",
      headers: headers(shipper, true),
      body: JSON.stringify({ planCode: "carrier-pro-monthly", idempotencyKey: "shipper-wrong-01" }),
    });
    assert.equal(wrongRole.status, 400);
    const driverActivate = await fetch(`${baseUrl}/api/packages/my-plan/demo-activate`, {
      method: "POST",
      headers: headers(driver, true),
      body: JSON.stringify({ planCode: "carrier-pro-monthly", idempotencyKey: "driver-denied-1" }),
    });
    assert.equal(driverActivate.status, 403);
    assert.equal((await fetch(`${baseUrl}/api/packages/my-plan/demo-activate`, {
      method: "POST",
      headers: headers(admin, true),
      body: JSON.stringify({ planCode: "shipper-pro-monthly", idempotencyKey: "admin-denied-01" }),
    })).status, 403);
    const activated = await fetch(`${baseUrl}/api/packages/my-plan/demo-activate`, {
      method: "POST",
      headers: headers(carrier, true),
      body: JSON.stringify({ planCode: "carrier-pro-monthly", idempotencyKey: "carrier-pro-0001" }),
    });
    assert.equal(activated.status, 200);
    const paid = (await activated.json()) as Json;
    assert.equal(paid.paymentCollected, false);
    assert.match(String(paid.label), /không phát sinh thanh toán/);
    const entitlements = paid.entitlements as Json;
    assert.equal(entitlements.planCode, "carrier-pro-monthly");
    assert.equal(entitlements.priceVnd, 999000);
    assert.equal(entitlements.rateBps, 400);
    assert.equal(entitlements.vehicleCap, 10);
    const replay = await fetch(`${baseUrl}/api/packages/my-plan/demo-activate`, {
      method: "POST",
      headers: headers(carrier, true),
      body: JSON.stringify({ planCode: "carrier-pro-monthly", idempotencyKey: "carrier-pro-0001" }),
    });
    assert.equal(replay.status, 200);
    assert.equal(await AccountSubscription.countDocuments({ accountId: carrierId }), 1);
    const switched = await fetch(`${baseUrl}/api/packages/my-plan/demo-activate`, {
      method: "POST",
      headers: headers(carrier, true),
      body: JSON.stringify({ planCode: "carrier-pro-annual", idempotencyKey: "carrier-annual-1" }),
    });
    assert.equal(switched.status, 409);
    const downgrade = await fetch(`${baseUrl}/api/packages/my-plan/schedule-downgrade`, {
      method: "POST",
      headers: headers(carrier, true),
      body: JSON.stringify({ idempotencyKey: "carrier-down-0001" }),
    });
    assert.equal(downgrade.status, 200);
    const afterDowngrade = (await (await fetch(`${baseUrl}/api/packages/my-plan`, { headers: headers(carrier) })).json()) as Json;
    assert.equal((afterDowngrade.plan as Json).code, "carrier-pro-monthly");
    assert.ok((afterDowngrade.plan as Json).scheduledDowngradeAt);
    const user = await User.findById(carrierId);
    assert.equal(user?.accountStatus ?? "ACTIVE", "ACTIVE");
  });
});

test("published plan versions stay immutable and contract tiers need explicit terms", async () => {
  await resetDisposable();
  await withServer(async (baseUrl) => {
    await fetch(`${baseUrl}/api/packages/catalog`);
    await assert.rejects(() => PlanVersion.updateOne({ planCode: "shipper-free", revision: 1 }, { priceVnd: 1 }), /immutable/);
    const carrier = await login(baseUrl, carrierEmail);
    const missing = await fetch(`${baseUrl}/api/packages/my-plan/demo-activate`, {
      method: "POST",
      headers: headers(carrier, true),
      body: JSON.stringify({ planCode: "carrier-enterprise", idempotencyKey: "enterprise-none-1" }),
    });
    assert.equal(missing.status, 409);
    const outside = await fetch(`${baseUrl}/api/packages/my-plan/demo-activate`, {
      method: "POST",
      headers: headers(carrier, true),
      body: JSON.stringify({
        planCode: "carrier-business",
        idempotencyKey: "business-bad-0001",
        contract: { priceVnd: 3000000, rateBps: 400 },
      }),
    });
    assert.equal(outside.status, 400);
    const business = await fetch(`${baseUrl}/api/packages/my-plan/demo-activate`, {
      method: "POST",
      headers: headers(carrier, true),
      body: JSON.stringify({
        planCode: "carrier-business",
        idempotencyKey: "business-ok-00001",
        contract: { priceVnd: 3000000, rateBps: 260 },
      }),
    });
    assert.equal(business.status, 200);
    const saved = (await business.json()) as Json;
    assert.equal((saved.entitlements as Json).rateBps, 260);
    assert.equal((saved.entitlements as Json).vehicleCap, 30);
    assert.notEqual((saved.entitlements as Json).rateBps, 275);
  });
});

test("vehicle caps, archive, restore and concurrent creates stay inside the plan", async () => {
  await resetDisposable();
  await withServer(async (baseUrl) => {
    const carrier = await login(baseUrl, carrierEmail);
    const other = await login(baseUrl, otherCarrierEmail);
    const first = await createVehicle(baseUrl, carrier, "51C-100.01");
    const second = await createVehicle(baseUrl, carrier, "51C-100.02");
    assert.equal(first.status, 201);
    assert.equal(second.status, 201);
    const third = await createVehicle(baseUrl, carrier, "51C-100.03");
    assert.equal(third.status, 409);
    assert.equal(await Vehicle.countDocuments({ carrierId, status: { $ne: "ARCHIVED" } }), 2);

    const archivedId = String((((await first.json()) as Json).vehicle as Json).id);
    const archived = await fetch(`${baseUrl}/api/carrier/fleet/vehicles/${archivedId}/archive`, {
      method: "POST",
      headers: headers(carrier, true),
      body: JSON.stringify({}),
    });
    assert.equal(archived.status, 200);
    const afterArchive = await createVehicle(baseUrl, carrier, "51C-100.04");
    assert.equal(afterArchive.status, 201);
    const restore = await fetch(`${baseUrl}/api/carrier/fleet/vehicles/${archivedId}/restore`, {
      method: "POST",
      headers: headers(carrier, true),
      body: JSON.stringify({}),
    });
    assert.equal(restore.status, 409);
    const hidden = await fetch(`${baseUrl}/api/carrier/fleet/vehicles/${archivedId}/archive`, {
      method: "POST",
      headers: headers(other, true),
      body: JSON.stringify({}),
    });
    assert.equal(hidden.status, 404);

    await resetDisposable();
    const raced = await Promise.all([
      createVehicle(baseUrl, carrier, "51C-200.01"),
      createVehicle(baseUrl, carrier, "51C-200.02"),
      createVehicle(baseUrl, carrier, "51C-200.03"),
    ]);
    assert.equal(raced.filter((response) => response.status === 201).length, 2);
    assert.equal(await Vehicle.countDocuments({ carrierId, status: { $ne: "ARCHIVED" } }), 2);

    await resetDisposable();
    await addVehicles(carrierId, 3);
    const legacy = await createVehicle(baseUrl, carrier, "51C-300.01");
    assert.equal(legacy.status, 409);
    assert.equal(await Vehicle.countDocuments({ carrierId }), 3);
    assert.equal((await User.findById(carrierId))?.accountStatus ?? "ACTIVE", "ACTIVE");

    await resetDisposable();
    const pro = await fetch(`${baseUrl}/api/packages/my-plan/demo-activate`, {
      method: "POST",
      headers: headers(carrier, true),
      body: JSON.stringify({ planCode: "carrier-pro-monthly", idempotencyKey: "cap-pro-monthly1" }),
    });
    assert.equal(pro.status, 200);
    await addVehicles(carrierId, 9);
    assert.equal((await createVehicle(baseUrl, carrier, "51C-400.10")).status, 201);
    assert.equal((await createVehicle(baseUrl, carrier, "51C-400.11")).status, 409);
    assert.equal(await Vehicle.countDocuments({ carrierId, status: { $ne: "ARCHIVED" } }), 10);

    await resetDisposable();
    const business = await fetch(`${baseUrl}/api/packages/my-plan/demo-activate`, {
      method: "POST",
      headers: headers(carrier, true),
      body: JSON.stringify({
        planCode: "carrier-business",
        idempotencyKey: "cap-business-0001",
        contract: { priceVnd: 2500000, rateBps: 300 },
      }),
    });
    assert.equal(business.status, 200);
    await addVehicles(carrierId, 29);
    assert.equal((await createVehicle(baseUrl, carrier, "51C-500.30")).status, 201);
    assert.equal((await createVehicle(baseUrl, carrier, "51C-500.31")).status, 409);

    await resetDisposable();
    const enterprise = await fetch(`${baseUrl}/api/packages/my-plan/demo-activate`, {
      method: "POST",
      headers: headers(carrier, true),
      body: JSON.stringify({
        planCode: "carrier-enterprise",
        idempotencyKey: "cap-enterprise-01",
        contract: { priceVnd: 8000000, rateBps: 200, vehicleCap: 4 },
      }),
    });
    assert.equal(enterprise.status, 200);
    await addVehicles(carrierId, 4);
    assert.equal((await createVehicle(baseUrl, carrier, "51C-600.05")).status, 409);
  });
});

test("over-limit blocks new claims but keeps claimed trips and driver operations", async () => {
  await resetDisposable();
  await withServer(async (baseUrl) => {
    const shipper = await login(baseUrl, shipperEmail);
    const carrier = await login(baseUrl, carrierEmail);
    const other = await login(baseUrl, otherCarrierEmail);
    const driver = await login(baseUrl, driverEmail);
    const open = await publish(baseUrl, shipper);
    const openId = String(open.id);
    const vehicle = await createVehicle(baseUrl, carrier, "51C-700.01");
    assert.equal(vehicle.status, 201);
    const vehicleId = String((((await vehicle.json()) as Json).vehicle as Json).id);
    const claimed = await fetch(`${baseUrl}/api/carrier/shipments/${openId}/claim`, {
      method: "POST",
      headers: headers(carrier, true),
      body: JSON.stringify({}),
    });
    assert.equal(claimed.status, 200);
    await addVehicles(carrierId, 2);
    const assigned = await fetch(`${baseUrl}/api/carrier/shipments/${openId}/assign`, {
      method: "POST",
      headers: headers(carrier, true),
      body: JSON.stringify({ vehicleId, driverId }),
    });
    assert.equal(assigned.status, 200);
    const blockedArchive = await fetch(`${baseUrl}/api/carrier/fleet/vehicles/${vehicleId}/archive`, {
      method: "POST",
      headers: headers(carrier, true),
      body: JSON.stringify({}),
    });
    assert.equal(blockedArchive.status, 409);
    const pickup = await fetch(`${baseUrl}/api/driver/shipments/${openId}/pickup`, {
      method: "POST",
      headers: headers(driver, true),
      body: JSON.stringify({}),
    });
    assert.equal(pickup.status, 200);
    const location = await fetch(`${baseUrl}/api/driver/shipments/${openId}/location`, {
      method: "POST",
      headers: headers(driver, true),
      body: JSON.stringify({ latitude: 10.82, longitude: 106.62, observedAt: new Date().toISOString() }),
    });
    assert.equal(location.status, 200);
    const delivery = await fetch(`${baseUrl}/api/driver/shipments/${openId}/delivery`, {
      method: "POST",
      headers: headers(driver, true),
      body: JSON.stringify({}),
    });
    assert.equal(delivery.status, 200);
    const another = await publish(baseUrl, shipper);
    const denied = await fetch(`${baseUrl}/api/carrier/shipments/${String(another.id)}/claim`, {
      method: "POST",
      headers: headers(carrier, true),
      body: JSON.stringify({}),
    });
    assert.equal(denied.status, 409);
    const winner = await fetch(`${baseUrl}/api/carrier/shipments/${String(another.id)}/claim`, {
      method: "POST",
      headers: headers(other, true),
      body: JSON.stringify({}),
    });
    assert.equal(winner.status, 200);
    assert.equal((await Shipment.findById(another.id))?.carrierId?.toString(), otherCarrierId);

    await resetDisposable();
    await fetch(`${baseUrl}/api/packages/my-plan/demo-activate`, {
      method: "POST",
      headers: headers(carrier, true),
      body: JSON.stringify({ planCode: "carrier-pro-monthly", idempotencyKey: "expiry-pro-00001" }),
    });
    await addVehicles(carrierId, 3);
    await AccountSubscription.updateOne({ accountId: carrierId }, { endAt: new Date(Date.now() - 1000), downgradeToFreeAt: null });
    const expired = (await (await fetch(`${baseUrl}/api/packages/my-plan/entitlements`, { headers: headers(carrier) })).json()) as Json;
    assert.equal((expired.entitlements as Json).planCode, "carrier-free");
    assert.equal((expired.entitlements as Json).overLimit, true);
    assert.equal(await Vehicle.countDocuments({ carrierId }), 3);
    const expiredClaim = await publish(baseUrl, shipper);
    assert.equal((await fetch(`${baseUrl}/api/carrier/shipments/${String(expiredClaim.id)}/claim`, {
      method: "POST",
      headers: headers(carrier, true),
      body: JSON.stringify({}),
    })).status, 409);
  });
});

async function createVehicle(baseUrl: string, cookie: string, plate: string) {
  return fetch(`${baseUrl}/api/carrier/fleet/vehicles`, {
    method: "POST",
    headers: headers(cookie, true),
    body: JSON.stringify({ ...vehicleBody, plate, label: `Xe ${plate}` }),
  });
}
