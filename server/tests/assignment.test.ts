import assert from "node:assert/strict";
import { createServer } from "node:http";
import { once } from "node:events";
import test, { before, after } from "node:test";
import mongoose from "mongoose";
import { hashPassword } from "../src/auth/password.js";
import { Shipment } from "../src/models/shipment.js";
import { User } from "../src/models/user.js";
import { Vehicle } from "../src/models/vehicle.js";

process.env.PORT ??= "4000";
process.env.FRONTEND_ORIGIN ??= "http://127.0.0.1:5173";
process.env.NODE_ENV = "test";
process.env.AUTH_SECRET ??= "test-secret-that-is-at-least-32-characters";

const sourceUri = process.env.MONGODB_URI ?? "mongodb://127.0.0.1:27017/coldi";
const testUri = new URL(sourceUri);
testUri.pathname = "/coldi_assignment_test";
process.env.MONGODB_URI = testUri.toString();

const { createApp } = await import("../src/app.js");

const password = "test-password-123";
const shipperEmail = "shipper.assignment-test@coldi.local";
const carrierEmail = "carrier.assignment-test@coldi.local";
const otherCarrierEmail = "other-carrier.assignment-test@coldi.local";
const driverEmail = "driver.assignment-test@coldi.local";
const secondDriverEmail = "second-driver.assignment-test@coldi.local";
const foreignDriverEmail = "foreign-driver.assignment-test@coldi.local";
const looseDriverEmail = "loose-driver.assignment-test@coldi.local";
const adminEmail = "admin.assignment-test@coldi.local";

type Json = Record<string, unknown>;

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

async function publish(baseUrl: string, cookie: string, cargoDescription: string) {
  const response = await fetch(`${baseUrl}/api/shipments`, {
    method: "POST",
    headers: { "content-type": "application/json", origin: "http://127.0.0.1:5173", cookie },
    body: JSON.stringify({
      cargoDescription,
      pickupLocation: "Cái Bè, Tiền Giang",
      deliveryLocation: "Thủ Đức, TP. Hồ Chí Minh",
      temperatureGroup: "FROZEN",
      vehicleRequirement: "Xe đông lạnh 8 tấn",
      listedPriceVnd: 6200000,
    }),
  });
  assert.equal(response.status, 201);
  return ((await response.json()) as { shipment: Json }).shipment;
}

function claim(baseUrl: string, cookie: string, id: string) {
  return fetch(`${baseUrl}/api/carrier/shipments/${id}/claim`, {
    method: "POST",
    headers: { "content-type": "application/json", origin: "http://127.0.0.1:5173", cookie },
    body: JSON.stringify({}),
  });
}

function assign(baseUrl: string, cookie: string | null, id: string, body: unknown) {
  return fetch(`${baseUrl}/api/carrier/shipments/${id}/assign`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      origin: "http://127.0.0.1:5173",
      ...(cookie ? { cookie } : {}),
    },
    body: JSON.stringify(body),
  });
}

before(async () => {
  await mongoose.connect(process.env.MONGODB_URI ?? "");
  if (mongoose.connection.name !== "coldi_assignment_test") {
    throw new Error(`Refusing to use database ${mongoose.connection.name}.`);
  }
  await mongoose.connection.dropDatabase();
  const passwordHash = await hashPassword(password);
  const [carrier, otherCarrier] = await User.create([
    { email: shipperEmail, passwordHash, role: "SHIPPER" },
    { email: carrierEmail, passwordHash, role: "CARRIER" },
    { email: otherCarrierEmail, passwordHash, role: "CARRIER" },
    { email: adminEmail, passwordHash, role: "ADMIN" },
  ]).then((users) => [users[1], users[2]]);
  if (!carrier || !otherCarrier) throw new Error("Carrier fixtures were not created.");
  await User.create([
    { email: driverEmail, passwordHash, role: "DRIVER", carrierId: carrier._id, displayName: "Tài xế một" },
    { email: secondDriverEmail, passwordHash, role: "DRIVER", carrierId: carrier._id, displayName: "Tài xế hai" },
    { email: foreignDriverEmail, passwordHash, role: "DRIVER", carrierId: otherCarrier._id, displayName: "Tài xế khác" },
    { email: looseDriverEmail, passwordHash, role: "DRIVER", displayName: "Tài xế chưa gắn nhà xe" },
  ]);
  await Vehicle.create([
    { carrierId: carrier._id, label: "Xe đông lạnh một" },
    { carrierId: carrier._id, label: "Xe đông lạnh hai" },
    { carrierId: otherCarrier._id, label: "Xe nhà xe khác" },
  ]);
});

after(async () => {
  if (mongoose.connection.name === "coldi_assignment_test") await mongoose.connection.dropDatabase();
  await mongoose.disconnect();
});

test("only the winning carrier can see and assign a claimed shipment", async () => {
  await withServer(async (baseUrl) => {
    const shipperCookie = await login(baseUrl, shipperEmail);
    const created = await publish(baseUrl, shipperCookie, "Cá tra đông lạnh");
    assert.equal(created.vehicleId, null);
    assert.equal(created.driverId, null);
    assert.equal(created.status, "PUBLISHED");
    const id = String(created.id);
    const carrierCookie = await login(baseUrl, carrierEmail);
    const claimed = await claim(baseUrl, carrierCookie, id);
    assert.equal(claimed.status, 200);

    const anonymous = await fetch(`${baseUrl}/api/carrier/shipments/claimed`);
    assert.equal(anonymous.status, 401);
    const anonymousAssign = await assign(baseUrl, null, id, {});
    assert.equal(anonymousAssign.status, 401);
    for (const email of [shipperEmail, driverEmail, adminEmail]) {
      const cookie = await login(baseUrl, email);
      const deniedList = await fetch(`${baseUrl}/api/carrier/shipments/claimed`, { headers: { cookie } });
      const deniedAssign = await assign(baseUrl, cookie, id, { vehicleId: "507f1f77bcf86cd799439011", driverId: "507f1f77bcf86cd799439012" });
      const deniedVehicles = await fetch(`${baseUrl}/api/carrier/fleet/vehicles`, { headers: { cookie } });
      assert.equal(deniedList.status, 403);
      assert.equal(deniedAssign.status, 403);
      assert.equal(deniedVehicles.status, 403);
    }

    const otherCookie = await login(baseUrl, otherCarrierEmail);
    const otherList = await fetch(`${baseUrl}/api/carrier/shipments/claimed`, { headers: { cookie: otherCookie } });
    const otherBody = (await otherList.json()) as { shipments: Json[] };
    assert.equal(otherBody.shipments.some((item) => item.id === id), false);

    const mine = await fetch(`${baseUrl}/api/carrier/shipments/claimed`, { headers: { cookie: carrierCookie } });
    const mineBody = (await mine.json()) as { shipments: Json[] };
    assert.equal(mine.status, 200);
    assert.equal(mineBody.shipments.some((item) => item.id === id && item.status === "MATCHED"), true);

    const vehicle = await Vehicle.findOne({ label: "Xe đông lạnh một" });
    const otherVehicle = await Vehicle.findOne({ label: "Xe nhà xe khác" });
    const driver = await User.findOne({ email: driverEmail });
    const foreignDriver = await User.findOne({ email: foreignDriverEmail });
    const looseDriver = await User.findOne({ email: looseDriverEmail });
    const shipper = await User.findOne({ email: shipperEmail });
    assert.ok(vehicle && otherVehicle && driver && foreignDriver && looseDriver && shipper);

    const spoof = await assign(baseUrl, carrierCookie, id, {
      vehicleId: vehicle._id.toString(),
      driverId: driver._id.toString(),
      carrierId: otherVehicle.carrierId.toString(),
    });
    assert.equal(spoof.status, 400);
    const untouched = await Shipment.findById(id);
    assert.equal(untouched?.vehicleId, undefined);
    assert.equal(untouched?.status, "MATCHED");

    const otherAssign = await assign(baseUrl, otherCookie, id, {
      vehicleId: otherVehicle._id.toString(),
      driverId: foreignDriver._id.toString(),
    });
    assert.equal(otherAssign.status, 403);

    for (const driverId of [shipper._id.toString(), foreignDriver._id.toString(), looseDriver._id.toString(), "507f1f77bcf86cd799439011"]) {
      const rejected = await assign(baseUrl, carrierCookie, id, { vehicleId: vehicle._id.toString(), driverId });
      assert.equal(rejected.status, 400);
    }
    const foreignVehicle = await assign(baseUrl, carrierCookie, id, {
      vehicleId: otherVehicle._id.toString(),
      driverId: driver._id.toString(),
    });
    assert.equal(foreignVehicle.status, 400);
    const missingVehicle = await assign(baseUrl, carrierCookie, id, {
      vehicleId: "not-an-id",
      driverId: driver._id.toString(),
    });
    assert.equal(missingVehicle.status, 400);

    const assigned = await assign(baseUrl, carrierCookie, id, {
      vehicleId: vehicle._id.toString(),
      driverId: driver._id.toString(),
    });
    const assignedBody = (await assigned.json()) as { shipment: Json };
    assert.equal(assigned.status, 200);
    assert.equal(assignedBody.shipment.status, "MATCHED");
    assert.equal(assignedBody.shipment.statusLabel, "Chờ lấy hàng");
    assert.equal(assignedBody.shipment.vehicleId, vehicle._id.toString());
    assert.equal(assignedBody.shipment.driverId, driver._id.toString());
    assert.equal(assignedBody.shipment.vehicleLabel, "Xe đông lạnh một");
    assert.equal(assignedBody.shipment.driverName, "Tài xế một");
    assert.equal(assignedBody.shipment.carrierId, vehicle.carrierId.toString());
    assert.notEqual(assignedBody.shipment.status, "PICKUP_CONFIRMED");
    assert.notEqual(assignedBody.shipment.status, "IN_TRANSIT");

    const stored = await Shipment.findById(id);
    assert.equal(stored?.status, "MATCHED");
    assert.equal(stored?.vehicleId?.toString(), vehicle._id.toString());
    assert.equal(stored?.driverId?.toString(), driver._id.toString());

    const again = await assign(baseUrl, carrierCookie, id, {
      vehicleId: vehicle._id.toString(),
      driverId: driver._id.toString(),
    });
    assert.equal(again.status, 409);
    const missingShipment = await assign(baseUrl, carrierCookie, "507f1f77bcf86cd799439011", {
      vehicleId: vehicle._id.toString(),
      driverId: driver._id.toString(),
    });
    assert.equal(missingShipment.status, 404);

    const owner = await fetch(`${baseUrl}/api/shipments/${id}`, { headers: { cookie: shipperCookie } });
    const ownerBody = (await owner.json()) as { shipment: Json };
    assert.equal(owner.status, 200);
    assert.equal(ownerBody.shipment.statusLabel, "Chờ lấy hàng");
    assert.equal(ownerBody.shipment.vehicleLabel, "Xe đông lạnh một");
    assert.equal(ownerBody.shipment.driverName, "Tài xế một");
    assert.equal("email" in ownerBody.shipment, false);
    assert.equal("passwordHash" in ownerBody.shipment, false);

    const fleet = await fetch(`${baseUrl}/api/carrier/fleet/vehicles`, { headers: { cookie: carrierCookie } });
    const fleetBody = (await fleet.json()) as { vehicles: Json[] };
    assert.equal(fleetBody.vehicles.some((item) => item.label === "Xe nhà xe khác"), false);
    assert.equal(fleetBody.vehicles.some((item) => item.label === "Xe đông lạnh một"), true);
  });
});

test("concurrent assignments keep one vehicle and driver pair", async () => {
  await withServer(async (baseUrl) => {
    const created = await publish(baseUrl, await login(baseUrl, shipperEmail), "Hàng phân công tranh chấp");
    const id = String(created.id);
    const carrierCookie = await login(baseUrl, carrierEmail);
    assert.equal((await claim(baseUrl, carrierCookie, id)).status, 200);
    const firstVehicle = await Vehicle.findOne({ label: "Xe đông lạnh một" });
    const secondVehicle = await Vehicle.findOne({ label: "Xe đông lạnh hai" });
    const firstDriver = await User.findOne({ email: driverEmail });
    const secondDriver = await User.findOne({ email: secondDriverEmail });
    assert.ok(firstVehicle && secondVehicle && firstDriver && secondDriver);

    const [first, second] = await Promise.all([
      assign(baseUrl, carrierCookie, id, { vehicleId: firstVehicle._id.toString(), driverId: firstDriver._id.toString() }),
      assign(baseUrl, carrierCookie, id, { vehicleId: secondVehicle._id.toString(), driverId: secondDriver._id.toString() }),
    ]);
    const responses = [first, second].sort((left, right) => left.status - right.status);
    const winner = responses[0];
    const loser = responses[1];
    assert.ok(winner && loser);
    assert.equal(winner.status, 200);
    assert.equal(loser.status, 409);
    const winnerBody = (await winner.json()) as { shipment: Json };
    const stored = await Shipment.findById(id);
    assert.equal(stored?.status, "MATCHED");
    assert.equal(stored?.vehicleId?.toString(), winnerBody.shipment.vehicleId);
    assert.equal(stored?.driverId?.toString(), winnerBody.shipment.driverId);
    const pair = `${stored?.vehicleId?.toString() ?? ""}:${stored?.driverId?.toString() ?? ""}`;
    const allowed = new Set([
      `${firstVehicle._id.toString()}:${firstDriver._id.toString()}`,
      `${secondVehicle._id.toString()}:${secondDriver._id.toString()}`,
    ]);
    assert.equal(allowed.has(pair), true);
    assert.equal(await Shipment.countDocuments({ _id: id, status: "MATCHED" }), 1);
  });
});
