import { withRequiredCargoImage } from "./support/cargoImage.js";
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
testUri.pathname = "/coldi_driver_test";
process.env.MONGODB_URI = testUri.toString();

const { createApp } = await import("../src/app.js");

const password = "test-password-123";
const shipperEmail = "shipper.driver-test@coldi.local";
const carrierEmail = "carrier.driver-test@coldi.local";
const driverEmail = "driver.driver-test@coldi.local";
const otherDriverEmail = "other-driver.driver-test@coldi.local";

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
    body: JSON.stringify(await withRequiredCargoImage(baseUrl, cookie, {
      cargoDescription,
      pickupLocation: "Cái Bè, Tiền Giang",
      deliveryLocation: "Thủ Đức, TP. Hồ Chí Minh",
      temperatureGroup: "FROZEN",
      vehicleRequirement: "Xe đông lạnh 8 tấn",
      listedPriceVnd: 6200000,
      pickupCompany: "Kho kiểm tra",
      pickupContactName: "Người lấy",
      pickupPhone: "0908123456",
      pickupEmail: "kho.gui@example.com",
      pickupDate: "2026-10-22",
      pickupTimeFrom: "08:00",
      pickupTimeTo: "11:30",
      deliveryCompany: "Kho giao",
      deliveryContactName: "Người nhận",
      deliveryPhone: "0912889999",
      deliveryEmail: "kho.nhan@example.com",
      deliveryDate: "2026-10-23",
      deliveryTimeFrom: "14:00",
      deliveryTimeTo: "18:00",
      cargoWeightTon: 2.5,
      cargoVolumeM3: 12,
      packageCount: 180,
    })),
  });
  assert.equal(response.status, 201);
  return ((await response.json()) as { shipment: Json }).shipment;
}

function post(baseUrl: string, cookie: string, path: string) {
  return fetch(`${baseUrl}${path}`, {
    method: "POST",
    headers: { "content-type": "application/json", origin: "http://127.0.0.1:5173", cookie },
    body: JSON.stringify({}),
  });
}

async function vehicleForNewTrip() {
  const carrier = await User.findOne({ email: carrierEmail });
  assert.ok(carrier);
  const vehicles = await Vehicle.find({ carrierId: carrier._id });
  for (const vehicle of vehicles) {
    if ((vehicle.leasedShipmentIds?.length ?? 0) > 0) continue;
    const unfinished = await Shipment.exists({
      vehicleId: vehicle._id,
      status: { $in: ["DRAFT", "MATCHED", "PICKUP_CONFIRMED", "IN_TRANSIT", "INCIDENT"] },
    });
    if (!unfinished) return vehicle;
  }
  return Vehicle.create({ carrierId: carrier._id, label: `Xe đông lạnh ${Date.now()}` });
}

before(async () => {
  await mongoose.connect(process.env.MONGODB_URI ?? "");
  if (mongoose.connection.name !== "coldi_driver_test") throw new Error(`Refusing to use database ${mongoose.connection.name}.`);
  await mongoose.connection.dropDatabase();
  const passwordHash = await hashPassword(password);
  const carrier = await User.create({ email: carrierEmail, passwordHash, role: "CARRIER" });
  await User.create([
    { email: shipperEmail, passwordHash, role: "SHIPPER" },
    { email: driverEmail, passwordHash, role: "DRIVER", carrierId: carrier._id, displayName: "Tài xế một" },
    { email: otherDriverEmail, passwordHash, role: "DRIVER", carrierId: carrier._id, displayName: "Tài xế hai" },
  ]);
  await Vehicle.create({ carrierId: carrier._id, label: "Xe đông lạnh demo" });
});

after(async () => {
  if (mongoose.connection.name === "coldi_driver_test") await mongoose.connection.dropDatabase();
  await mongoose.disconnect();
});

test("an assigned driver sees only their trip and other roles cannot use driver routes", async () => {
  await withServer(async (baseUrl) => {
    const shipperCookie = await login(baseUrl, shipperEmail);
    const carrierCookie = await login(baseUrl, carrierEmail);
    const driverCookie = await login(baseUrl, driverEmail);
    const otherCookie = await login(baseUrl, otherDriverEmail);
    const created = await publish(baseUrl, shipperCookie, "Đơn kiểm tra tài xế");
    const id = String(created.id);
    const claim = await post(baseUrl, carrierCookie, `/api/carrier/shipments/${id}/claim`);
    assert.equal(claim.status, 200);
    const vehicle = await vehicleForNewTrip();
    const driver = await User.findOne({ email: driverEmail });
    assert.ok(vehicle && driver);
    const assigned = await fetch(`${baseUrl}/api/carrier/shipments/${id}/assign`, {
      method: "POST",
      headers: { "content-type": "application/json", origin: "http://127.0.0.1:5173", cookie: carrierCookie },
      body: JSON.stringify({ vehicleId: vehicle._id.toString(), driverId: driver._id.toString() }),
    });
    assert.equal(assigned.status, 200);

    const mine = await fetch(`${baseUrl}/api/driver/shipments`, { headers: { cookie: driverCookie } });
    const mineBody = (await mine.json()) as { shipments: Json[] };
    assert.equal(mine.status, 200);
    assert.equal(mineBody.shipments.length, 1);
    assert.equal(mineBody.shipments[0]?.status, "MATCHED");
    assert.equal(mineBody.shipments[0]?.statusLabel, "Chờ lấy hàng");
    assert.equal(mineBody.shipments[0]?.nextAction, "pickup");
    assert.equal(mineBody.shipments[0]?.pickupPhone, "0908123456");
    assert.equal("pickupEmail" in (mineBody.shipments[0] ?? {}), false);

    const other = await fetch(`${baseUrl}/api/driver/shipments`, { headers: { cookie: otherCookie } });
    const otherBody = (await other.json()) as { shipments: Json[] };
    assert.equal(otherBody.shipments.length, 0);
    const hidden = await fetch(`${baseUrl}/api/driver/shipments/${id}`, { headers: { cookie: otherCookie } });
    assert.equal(hidden.status, 404);

    for (const cookie of [shipperCookie, carrierCookie]) {
      const denied = await fetch(`${baseUrl}/api/driver/shipments`, { headers: { cookie } });
      assert.equal(denied.status, 403);
    }
  });
});

test("pickup and delivery follow the assigned driver lifecycle without duplicating milestones", async () => {
  await withServer(async (baseUrl) => {
    const shipperCookie = await login(baseUrl, shipperEmail);
    const carrierCookie = await login(baseUrl, carrierEmail);
    const driverCookie = await login(baseUrl, driverEmail);
    const otherCookie = await login(baseUrl, otherDriverEmail);
    const created = await publish(baseUrl, shipperCookie, "Đơn kiểm tra lấy giao");
    const id = String(created.id);
    assert.equal((await post(baseUrl, carrierCookie, `/api/carrier/shipments/${id}/claim`)).status, 200);

    const early = await post(baseUrl, driverCookie, `/api/driver/shipments/${id}/pickup`);
    assert.equal(early.status, 404);

    const vehicle = await vehicleForNewTrip();
    const driver = await User.findOne({ email: driverEmail });
    assert.ok(vehicle && driver);
    assert.equal(
      (
        await fetch(`${baseUrl}/api/carrier/shipments/${id}/assign`, {
          method: "POST",
          headers: { "content-type": "application/json", origin: "http://127.0.0.1:5173", cookie: carrierCookie },
          body: JSON.stringify({ vehicleId: vehicle._id.toString(), driverId: driver._id.toString() }),
        })
      ).status,
      200,
    );

    const deliveryEarly = await post(baseUrl, driverCookie, `/api/driver/shipments/${id}/delivery`);
    assert.equal(deliveryEarly.status, 409);
    const otherPickup = await post(baseUrl, otherCookie, `/api/driver/shipments/${id}/pickup`);
    assert.equal(otherPickup.status, 404);

    const picked = await post(baseUrl, driverCookie, `/api/driver/shipments/${id}/pickup`);
    assert.equal(picked.status, 200);
    const pickedBody = (await picked.json()) as { shipment: Json };
    assert.equal(pickedBody.shipment.status, "IN_TRANSIT");
    assert.equal(pickedBody.shipment.statusLabel, "Đang vận chuyển");
    assert.equal(pickedBody.shipment.nextAction, "delivery");
    assert.equal(typeof pickedBody.shipment.pickupConfirmedAt, "string");
    const firstPickup = pickedBody.shipment.pickupConfirmedAt;

    const pickedAgain = await post(baseUrl, driverCookie, `/api/driver/shipments/${id}/pickup`);
    const againBody = (await pickedAgain.json()) as { shipment: Json };
    assert.equal(pickedAgain.status, 200);
    assert.equal(againBody.shipment.pickupConfirmedAt, firstPickup);
    assert.equal(againBody.shipment.status, "IN_TRANSIT");
    const storedPickup = await Shipment.findById(id);
    assert.equal(storedPickup?.pickupConfirmedAt?.toISOString(), firstPickup);
    assert.equal(storedPickup?.pickupConfirmedBy?.toString(), driver._id.toString());

    const shipperView = await fetch(`${baseUrl}/api/shipments/${id}`, { headers: { cookie: shipperCookie } });
    const shipperBody = (await shipperView.json()) as { shipment: Json };
    assert.equal(shipperBody.shipment.status, "IN_TRANSIT");
    assert.equal(shipperBody.shipment.pickupEmail, "kho.gui@example.com");
    const carrierView = await fetch(`${baseUrl}/api/carrier/shipments/claimed`, { headers: { cookie: carrierCookie } });
    const carrierBody = (await carrierView.json()) as { shipments: Json[] };
    assert.equal(carrierBody.shipments.some((item) => item.id === id && item.status === "IN_TRANSIT"), true);

    const delivered = await Promise.all([
      post(baseUrl, driverCookie, `/api/driver/shipments/${id}/delivery`),
      post(baseUrl, driverCookie, `/api/driver/shipments/${id}/delivery`),
    ]);
    assert.equal(delivered.every((response) => response.status === 200), true);
    const deliveredBodies = await Promise.all(
      delivered.map(async (response) => ((await response.json()) as { shipment: Json }).shipment),
    );
    assert.equal(deliveredBodies[0]?.status, "DELIVERY_CONFIRMED");
    assert.equal(deliveredBodies[1]?.status, "DELIVERY_CONFIRMED");
    assert.equal(deliveredBodies[0]?.deliveryConfirmedAt, deliveredBodies[1]?.deliveryConfirmedAt);
    assert.notEqual(deliveredBodies[0]?.status, "COMPLETED");
    const stored = await Shipment.findById(id);
    assert.equal(stored?.status, "DELIVERY_CONFIRMED");
    assert.equal(stored?.pickupConfirmedAt?.toISOString(), firstPickup);
    assert.ok(stored?.deliveryConfirmedAt);
    assert.equal(stored?.deliveryConfirmedBy?.toString(), driver._id.toString());
    assert.notEqual(stored?.status, "COMPLETED");

    const finalShipper = await fetch(`${baseUrl}/api/shipments/${id}`, { headers: { cookie: shipperCookie } });
    const finalBody = (await finalShipper.json()) as { shipment: Json };
    assert.equal(finalBody.shipment.statusLabel, "Đã xác nhận giao hàng");
    assert.equal(finalBody.shipment.status, "DELIVERY_CONFIRMED");
  });
});

test("concurrent pickup requests keep one milestone and do not move backward", async () => {
  await withServer(async (baseUrl) => {
    const shipperCookie = await login(baseUrl, shipperEmail);
    const carrierCookie = await login(baseUrl, carrierEmail);
    const driverCookie = await login(baseUrl, driverEmail);
    const created = await publish(baseUrl, shipperCookie, "Đơn kiểm tra lấy đồng thời");
    const id = String(created.id);
    assert.equal((await post(baseUrl, carrierCookie, `/api/carrier/shipments/${id}/claim`)).status, 200);
    const vehicle = await vehicleForNewTrip();
    const driver = await User.findOne({ email: driverEmail });
    assert.ok(vehicle && driver);
    assert.equal(
      (
        await fetch(`${baseUrl}/api/carrier/shipments/${id}/assign`, {
          method: "POST",
          headers: { "content-type": "application/json", origin: "http://127.0.0.1:5173", cookie: carrierCookie },
          body: JSON.stringify({ vehicleId: vehicle._id.toString(), driverId: driver._id.toString() }),
        })
      ).status,
      200,
    );
    const responses = await Promise.all([
      post(baseUrl, driverCookie, `/api/driver/shipments/${id}/pickup`),
      post(baseUrl, driverCookie, `/api/driver/shipments/${id}/pickup`),
    ]);
    assert.equal(responses.every((response) => response.status === 200), true);
    const bodies = await Promise.all(responses.map(async (response) => ((await response.json()) as { shipment: Json }).shipment));
    assert.equal(bodies[0]?.status, "IN_TRANSIT");
    assert.equal(bodies[1]?.status, "IN_TRANSIT");
    assert.equal(bodies[0]?.pickupConfirmedAt, bodies[1]?.pickupConfirmedAt);
    assert.notEqual(bodies[0]?.status, "COMPLETED");
    const stored = await Shipment.findById(id);
    assert.equal(stored?.status, "IN_TRANSIT");
    assert.equal(stored?.pickupConfirmedBy?.toString(), driver._id.toString());
    assert.equal(stored?.pickupConfirmedAt?.toISOString(), bodies[0]?.pickupConfirmedAt);
  });
});

test("unauthorized roles, forged fields, and a stale request cannot change the milestone", async () => {
  await withServer(async (baseUrl) => {
    const guest = await fetch(`${baseUrl}/api/driver/shipments`);
    assert.equal(guest.status, 401);
    const guestPickup = await fetch(`${baseUrl}/api/driver/shipments/000000000000000000000001/pickup`, {
      method: "POST",
      headers: { "content-type": "application/json", origin: "http://127.0.0.1:5173" },
      body: JSON.stringify({}),
    });
    assert.equal(guestPickup.status, 401);

    const shipperCookie = await login(baseUrl, shipperEmail);
    const carrierCookie = await login(baseUrl, carrierEmail);
    const driverCookie = await login(baseUrl, driverEmail);
    const otherCookie = await login(baseUrl, otherDriverEmail);
    const created = await publish(baseUrl, shipperCookie, "Đơn kiểm tra quyền tài xế");
    const id = String(created.id);
    assert.equal((await post(baseUrl, carrierCookie, `/api/carrier/shipments/${id}/claim`)).status, 200);

    const hidden = await fetch(`${baseUrl}/api/driver/shipments/${id}`, { headers: { cookie: driverCookie } });
    assert.equal(hidden.status, 404);

    const vehicle = await vehicleForNewTrip();
    const driver = await User.findOne({ email: driverEmail });
    const other = await User.findOne({ email: otherDriverEmail });
    assert.ok(vehicle && driver && other);
    assert.equal(
      (
        await fetch(`${baseUrl}/api/carrier/shipments/${id}/assign`, {
          method: "POST",
          headers: { "content-type": "application/json", origin: "http://127.0.0.1:5173", cookie: carrierCookie },
          body: JSON.stringify({ vehicleId: vehicle._id.toString(), driverId: driver._id.toString() }),
        })
      ).status,
      200,
    );

    for (const cookie of [shipperCookie, carrierCookie]) {
      const deniedPickup = await post(baseUrl, cookie, `/api/driver/shipments/${id}/pickup`);
      const deniedDelivery = await post(baseUrl, cookie, `/api/driver/shipments/${id}/delivery`);
      assert.equal(deniedPickup.status, 403);
      assert.equal(deniedDelivery.status, 403);
    }
    assert.equal((await post(baseUrl, otherCookie, `/api/driver/shipments/${id}/delivery`)).status, 404);

    const forged = await fetch(`${baseUrl}/api/driver/shipments/${id}/pickup`, {
      method: "POST",
      headers: { "content-type": "application/json", origin: "http://127.0.0.1:5173", cookie: driverCookie },
      body: JSON.stringify({ driverId: other._id.toString(), carrierId: other._id.toString(), status: "COMPLETED" }),
    });
    assert.equal(forged.status, 400);
    const untouched = await Shipment.findById(id);
    assert.equal(untouched?.status, "MATCHED");
    assert.equal(untouched?.driverId?.toString(), driver._id.toString());
    assert.equal(untouched?.pickupConfirmedAt ?? null, null);

    const picked = await fetch(`${baseUrl}/api/driver/shipments/${id}/pickup`, {
      method: "POST",
      headers: { "content-type": "application/json", origin: "http://127.0.0.1:5173", cookie: driverCookie },
      body: JSON.stringify({ pickupConfirmedAt: "2000-01-01T00:00:00.000Z" }),
    });
    assert.equal(picked.status, 200);
    const pickedBody = (await picked.json()) as { shipment: Json };
    const storedPickup = await Shipment.findById(id);
    assert.equal(storedPickup?.status, "IN_TRANSIT");
    assert.notEqual(storedPickup?.pickupConfirmedAt?.toISOString(), "2000-01-01T00:00:00.000Z");
    assert.equal(pickedBody.shipment.pickupConfirmedAt, storedPickup?.pickupConfirmedAt?.toISOString());
    assert.equal(storedPickup?.pickupConfirmedBy?.toString(), driver._id.toString());

    const delivered = await post(baseUrl, driverCookie, `/api/driver/shipments/${id}/delivery`);
    const deliveredBody = (await delivered.json()) as { shipment: Json };
    assert.equal(delivered.status, 200);
    const repeated = await post(baseUrl, driverCookie, `/api/driver/shipments/${id}/delivery`);
    const repeatedBody = (await repeated.json()) as { shipment: Json };
    assert.equal(repeated.status, 200);
    assert.equal(repeatedBody.shipment.deliveryConfirmedAt, deliveredBody.shipment.deliveryConfirmedAt);
    const storedDelivery = await Shipment.findById(id);
    assert.equal(storedDelivery?.deliveryConfirmedAt?.toISOString(), deliveredBody.shipment.deliveryConfirmedAt);
    assert.equal(storedDelivery?.deliveryConfirmedBy?.toString(), driver._id.toString());

    const stale = await post(baseUrl, driverCookie, `/api/driver/shipments/${id}/pickup`);
    const staleBody = (await stale.json()) as { shipment: Json };
    assert.equal(stale.status, 200);
    assert.equal(staleBody.shipment.status, "DELIVERY_CONFIRMED");
    const afterStale = await Shipment.findById(id);
    assert.equal(afterStale?.status, "DELIVERY_CONFIRMED");
    assert.equal(afterStale?.pickupConfirmedAt?.toISOString(), storedPickup?.pickupConfirmedAt?.toISOString());
    assert.equal(afterStale?.pickupConfirmedBy?.toString(), driver._id.toString());
    assert.equal(afterStale?.deliveryConfirmedAt?.toISOString(), storedDelivery?.deliveryConfirmedAt?.toISOString());
    assert.equal(afterStale?.deliveryConfirmedBy?.toString(), driver._id.toString());
    assert.notEqual(afterStale?.status, "COMPLETED");

    const carrierView = await fetch(`${baseUrl}/api/carrier/shipments/claimed`, { headers: { cookie: carrierCookie } });
    const carrierBody = (await carrierView.json()) as { shipments: Json[] };
    assert.equal(carrierBody.shipments.some((item) => item.id === id && item.status === "DELIVERY_CONFIRMED"), true);
    const shipperView = await fetch(`${baseUrl}/api/shipments/${id}`, { headers: { cookie: shipperCookie } });
    const shipperBody = (await shipperView.json()) as { shipment: Json };
    assert.equal(shipperBody.shipment.status, "DELIVERY_CONFIRMED");
    assert.equal(shipperBody.shipment.statusLabel, "Đã xác nhận giao hàng");
  });
});
