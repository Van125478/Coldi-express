import assert from "node:assert/strict";
import { createServer } from "node:http";
import { once } from "node:events";
import test, { before, after } from "node:test";
import mongoose from "mongoose";
import { hashPassword } from "../src/auth/password.js";
import { Conversation } from "../src/models/conversation.js";
import { Shipment } from "../src/models/shipment.js";
import { User } from "../src/models/user.js";
import { Vehicle } from "../src/models/vehicle.js";

process.env.PORT ??= "4000";
process.env.FRONTEND_ORIGIN ??= "http://127.0.0.1:5173";
process.env.NODE_ENV = "test";
process.env.AUTH_SECRET ??= "test-secret-that-is-at-least-32-characters";

const sourceUri = process.env.MONGODB_URI ?? "mongodb://127.0.0.1:27017/coldi";
const testUri = new URL(sourceUri);
testUri.pathname = "/coldi_fleet_test";
process.env.MONGODB_URI = testUri.toString();

const { createApp } = await import("../src/app.js");

const password = "test-password-123";
const shipperEmail = "shipper.fleet-test@coldi.local";
const carrierEmail = "carrier.fleet-test@coldi.local";
const otherCarrierEmail = "other-carrier.fleet-test@coldi.local";
const driverEmail = "driver.fleet-test@coldi.local";
const otherDriverEmail = "other-driver.fleet-test@coldi.local";

type Json = Record<string, unknown>;
const vehicleBody = {
  label: "Xe lạnh mới",
  plate: "51C-123.45",
  vehicleKind: "REEFER_TRUCK",
  temperatureGroup: "FROZEN",
  capacityTon: 8.5,
};

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

async function publish(baseUrl: string, cookie: string) {
  const response = await fetch(`${baseUrl}/api/shipments`, {
    method: "POST",
    headers: { "content-type": "application/json", origin: "http://127.0.0.1:5173", cookie },
    body: JSON.stringify({
      cargoDescription: "Hàng kiểm tra đội xe",
      pickupLocation: "Cái Bè, Tiền Giang",
      deliveryLocation: "Thủ Đức, TP. Hồ Chí Minh",
      temperatureGroup: "FROZEN",
      vehicleRequirement: "Xe đông lạnh 8 tấn",
      listedPriceVnd: 6200000,
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
      cargoWeightTon: 2.5,
      cargoVolumeM3: 12,
      packageCount: 180,
    }),
  });
  assert.equal(response.status, 201);
  return ((await response.json()) as Json).shipment as Json;
}

before(async () => {
  await mongoose.connect(process.env.MONGODB_URI ?? "");
  if (mongoose.connection.name !== "coldi_fleet_test") throw new Error(`Refusing to use database ${mongoose.connection.name}.`);
  await mongoose.connection.dropDatabase();
  const passwordHash = await hashPassword(password);
  const carrier = await User.create({ email: carrierEmail, passwordHash, role: "CARRIER", displayName: "Nhà xe A" });
  const other = await User.create({ email: otherCarrierEmail, passwordHash, role: "CARRIER", displayName: "Nhà xe B" });
  await User.create([
    { email: shipperEmail, passwordHash, role: "SHIPPER", displayName: "Chủ hàng kiểm tra" },
    { email: driverEmail, passwordHash, role: "DRIVER", carrierId: carrier._id, displayName: "Tài xế A" },
    { email: otherDriverEmail, passwordHash, role: "DRIVER", carrierId: other._id, displayName: "Tài xế B" },
  ]);
  await Vehicle.create({ carrierId: carrier._id, label: "Xe đông lạnh demo Core 05" });
});

after(async () => {
  if (mongoose.connection.name === "coldi_fleet_test") await mongoose.connection.dropDatabase();
  await mongoose.disconnect();
});

test("a carrier manages only its own vehicles and a new vehicle can be assigned", async () => {
  await withServer(async (baseUrl) => {
    const carrier = await login(baseUrl, carrierEmail);
    const other = await login(baseUrl, otherCarrierEmail);
    const shipper = await login(baseUrl, shipperEmail);
    const driver = await login(baseUrl, driverEmail);
    const created = await fetch(`${baseUrl}/api/carrier/fleet/vehicles`, {
      method: "POST",
      headers: { "content-type": "application/json", origin: "http://127.0.0.1:5173", cookie: carrier },
      body: JSON.stringify(vehicleBody),
    });
    assert.equal(created.status, 201);
    const vehicle = ((await created.json()) as Json).vehicle as Json;
    const id = String(vehicle.id);
    const read = await fetch(`${baseUrl}/api/carrier/fleet/vehicles/${id}`, { headers: { cookie: carrier } });
    assert.equal(read.status, 200);
    const readBody = ((await read.json()) as Json).vehicle as Json;
    assert.equal(readBody.plate, "51C-123.45");
    assert.equal(readBody.label, "Xe lạnh mới");
    const listed = await fetch(`${baseUrl}/api/carrier/fleet/vehicles`, { headers: { cookie: carrier } });
    const labels = (((await listed.json()) as Json).vehicles as Json[]).map((item) => item.label);
    assert.equal(labels.includes("Xe lạnh mới"), true);
    assert.equal(labels.includes("Xe đông lạnh demo Core 05"), true);
    const hidden = await fetch(`${baseUrl}/api/carrier/fleet/vehicles/${id}`, { headers: { cookie: other } });
    assert.equal(hidden.status, 404);
    const editedByOther = await fetch(`${baseUrl}/api/carrier/fleet/vehicles/${id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json", origin: "http://127.0.0.1:5173", cookie: other },
      body: JSON.stringify({ ...vehicleBody, label: "Xe bị chiếm" }),
    });
    assert.equal(editedByOther.status, 404);
    const forged = await fetch(`${baseUrl}/api/carrier/fleet/vehicles`, {
      method: "POST",
      headers: { "content-type": "application/json", origin: "http://127.0.0.1:5173", cookie: carrier },
      body: JSON.stringify({ ...vehicleBody, carrierId: "other" }),
    });
    assert.equal(forged.status, 400);
    const invalid = await fetch(`${baseUrl}/api/carrier/fleet/vehicles`, {
      method: "POST",
      headers: { "content-type": "application/json", origin: "http://127.0.0.1:5173", cookie: carrier },
      body: JSON.stringify({ ...vehicleBody, capacityTon: 0 }),
    });
    assert.equal(invalid.status, 400);
    assert.equal((await fetch(`${baseUrl}/api/carrier/fleet/vehicles`, { headers: { cookie: shipper } })).status, 403);
    assert.equal((await fetch(`${baseUrl}/api/carrier/fleet/vehicles`, { headers: { cookie: driver } })).status, 403);
    assert.equal((await fetch(`${baseUrl}/api/carrier/fleet/vehicles`)).status, 401);
    assert.equal((await fetch(`${baseUrl}/api/carrier/fleet/vehicles/not-an-id`, { headers: { cookie: carrier } })).status, 404);
    const removed = await fetch(`${baseUrl}/api/carrier/fleet/vehicles/${id}`, { method: "DELETE", headers: { cookie: carrier } });
    assert.equal(removed.status, 404);

    const shipment = await publish(baseUrl, shipper);
    const shipmentId = String(shipment.id);
    const claimed = await fetch(`${baseUrl}/api/carrier/shipments/${shipmentId}/claim`, {
      method: "POST",
      headers: { "content-type": "application/json", origin: "http://127.0.0.1:5173", cookie: carrier },
      body: JSON.stringify({}),
    });
    assert.equal(claimed.status, 200);
    const driverUser = await User.findOne({ email: driverEmail });
    assert.ok(driverUser);
    const assigned = await fetch(`${baseUrl}/api/carrier/shipments/${shipmentId}/assign`, {
      method: "POST",
      headers: { "content-type": "application/json", origin: "http://127.0.0.1:5173", cookie: carrier },
      body: JSON.stringify({ vehicleId: id, driverId: driverUser.id }),
    });
    assert.equal(assigned.status, 200);
    const renamed = await fetch(`${baseUrl}/api/carrier/fleet/vehicles/${id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json", origin: "http://127.0.0.1:5173", cookie: carrier },
      body: JSON.stringify({ ...vehicleBody, label: "Xe lạnh đã sửa" }),
    });
    assert.equal(renamed.status, 200);
    const stored = await Shipment.findById(shipmentId);
    assert.equal(stored?.status, "MATCHED");
    assert.equal(stored?.vehicleId?.toString(), id);
    assert.equal(stored?.listedPriceVnd, 6200000);
    assert.equal(stored?.latestLocation ?? null, null);
    assert.deepEqual(stored?.events?.map((event) => event.type), ["PUBLISHED", "CLAIMED", "ASSIGNED"]);
    assert.equal(await Conversation.countDocuments({ shipmentId }), 0);
    const roster = await fetch(`${baseUrl}/api/carrier/fleet/drivers`, { headers: { cookie: carrier } });
    const names = (((await roster.json()) as Json).drivers as Json[]).map((item) => item.displayName);
    assert.deepEqual(names, ["Tài xế A"]);
    const otherDriver = await User.findOne({ email: otherDriverEmail });
    assert.ok(otherDriver);
    const privateDriver = await fetch(`${baseUrl}/api/carrier/fleet/drivers/${otherDriver.id}`, { headers: { cookie: carrier } });
    assert.equal(privateDriver.status, 404);
    const renamedDriver = await fetch(`${baseUrl}/api/carrier/fleet/drivers/${driverUser.id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json", origin: "http://127.0.0.1:5173", cookie: carrier },
      body: JSON.stringify({ displayName: "Tài xế A đã sửa", role: "CARRIER" }),
    });
    assert.equal(renamedDriver.status, 400);
    const safeRename = await fetch(`${baseUrl}/api/carrier/fleet/drivers/${driverUser.id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json", origin: "http://127.0.0.1:5173", cookie: carrier },
      body: JSON.stringify({ displayName: "Tài xế A đã sửa" }),
    });
    assert.equal(safeRename.status, 200);
    const stillDriver = await User.findById(driverUser.id).select("role carrierId passwordHash");
    assert.equal(stillDriver?.role, "DRIVER");
    assert.equal(stillDriver?.carrierId?.toString(), (await User.findOne({ email: carrierEmail }))?.id);
    assert.equal(typeof stillDriver?.passwordHash, "string");
  });
});
