import assert from "node:assert/strict";
import { createServer } from "node:http";
import { once } from "node:events";
import test, { before, after } from "node:test";
import mongoose from "mongoose";
import { distanceKm, planPing, STATIONARY_INTERVAL_MS, MOVING_INTERVAL_MS } from "../src/gps/pingPolicy.js";
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
testUri.pathname = "/coldi_gps_test";
process.env.MONGODB_URI = testUri.toString();

const { createApp } = await import("../src/app.js");

const password = "test-password-123";
const shipperEmail = "shipper.gps-test@coldi.local";
const otherShipperEmail = "other-shipper.gps-test@coldi.local";
const carrierEmail = "carrier.gps-test@coldi.local";
const driverEmail = "driver.gps-test@coldi.local";
const otherDriverEmail = "other-driver.gps-test@coldi.local";
const adminEmail = "admin.gps-test@coldi.local";
const otherCarrierEmail = "other-carrier.gps-test@coldi.local";
const latitude = 10.82345;
const longitude = 106.62965;

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

function publish(baseUrl: string, cookie: string) {
  return fetch(`${baseUrl}/api/shipments`, {
    method: "POST",
    headers: { "content-type": "application/json", origin: "http://127.0.0.1:5173", cookie },
    body: JSON.stringify({
      cargoDescription: "Hàng kiểm tra GPS",
      pickupLocation: "Cái Bè, Tiền Giang",
      deliveryLocation: "Thủ Đức, TP. Hồ Chí Minh",
      temperatureGroup: "FROZEN",
      vehicleRequirement: "Xe đông lạnh 8 tấn",
      listedPriceVnd: 6200000,
      pickupCompany: "Kho kiểm tra",
      pickupContactName: "Người lấy",
      pickupPhone: "0908123456",
      pickupEmail: "pickup.gps@example.com",
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
}

async function transit(baseUrl: string) {
  const shipper = await login(baseUrl, shipperEmail);
  const carrier = await login(baseUrl, carrierEmail);
  const driver = await login(baseUrl, driverEmail);
  const created = await publish(baseUrl, shipper);
  assert.equal(created.status, 201);
  const shipment = ((await created.json()) as Json).shipment as Json;
  const id = String(shipment.id);
  const vehicle = await Vehicle.findOne({ label: "Xe đông lạnh kiểm tra" });
  const driverUser = await User.findOne({ email: driverEmail });
  assert.ok(vehicle && driverUser);
  const claimed = await fetch(`${baseUrl}/api/carrier/shipments/${id}/claim`, {
    method: "POST",
    headers: { "content-type": "application/json", origin: "http://127.0.0.1:5173", cookie: carrier },
    body: JSON.stringify({}),
  });
  assert.equal(claimed.status, 200);
  const assigned = await fetch(`${baseUrl}/api/carrier/shipments/${id}/assign`, {
    method: "POST",
    headers: { "content-type": "application/json", origin: "http://127.0.0.1:5173", cookie: carrier },
    body: JSON.stringify({ vehicleId: vehicle.id, driverId: driverUser.id }),
  });
  assert.equal(assigned.status, 200);
  return { id, shipper, carrier, driver, vehicleId: String(vehicle.id), driverId: String(driverUser.id) };
}

function locate(baseUrl: string, cookie: string, id: string, observedAt: string, extra: Json = {}) {
  return fetch(`${baseUrl}/api/driver/shipments/${id}/location`, {
    method: "POST",
    headers: { "content-type": "application/json", origin: "http://127.0.0.1:5173", cookie },
    body: JSON.stringify({ latitude, longitude, observedAt, ...extra }),
  });
}

before(async () => {
  await mongoose.connect(process.env.MONGODB_URI ?? "");
  if (mongoose.connection.name !== "coldi_gps_test") throw new Error(`Refusing to use database ${mongoose.connection.name}.`);
  await mongoose.connection.dropDatabase();
  const passwordHash = await hashPassword(password);
  const carrier = await User.create({ email: carrierEmail, passwordHash, role: "CARRIER", displayName: "Nhà xe kiểm tra" });
  const otherCarrier = await User.create({ email: otherCarrierEmail, passwordHash, role: "CARRIER", displayName: "Nhà xe khác" });
  await User.create([
    { email: shipperEmail, passwordHash, role: "SHIPPER", displayName: "Chủ hàng kiểm tra" },
    { email: otherShipperEmail, passwordHash, role: "SHIPPER", displayName: "Chủ hàng khác" },
    { email: driverEmail, passwordHash, role: "DRIVER", carrierId: carrier._id, displayName: "Tài xế kiểm tra" },
    { email: otherDriverEmail, passwordHash, role: "DRIVER", carrierId: otherCarrier._id, displayName: "Tài xế khác" },
    { email: adminEmail, passwordHash, role: "ADMIN", displayName: "Quản trị kiểm tra" },
  ]);
  await Vehicle.create({ carrierId: carrier._id, label: "Xe đông lạnh kiểm tra" });
});

after(async () => {
  if (mongoose.connection.name === "coldi_gps_test") await mongoose.connection.dropDatabase();
  await mongoose.disconnect();
});

test("adaptive ping policy stays inside the reference targets", () => {
  assert.equal(planPing({ speedKmh: 0, distanceKmSinceAccepted: 3 }).intervalMs, STATIONARY_INTERVAL_MS);
  assert.equal(planPing({ speedKmh: 0, distanceKmSinceAccepted: 3 }).uploadBecauseDistance, false);
  assert.equal(planPing({ speedKmh: 5, distanceKmSinceAccepted: 1 }).intervalMs, MOVING_INTERVAL_MS);
  assert.equal(planPing({ speedKmh: 5, distanceKmSinceAccepted: 2.1 }).reason, "distance");
  assert.equal(planPing({ speedKmh: null, distanceKmSinceAccepted: null }).reason, "unknown_speed");
  assert.equal(planPing({ speedKmh: null, distanceKmSinceAccepted: 2.4 }).uploadBecauseDistance, true);
  assert.equal(planPing({ speedKmh: 40, distanceKmSinceAccepted: null }).warehouseProximity, "unavailable");
  assert.equal(planPing({ speedKmh: 40, distanceKmSinceAccepted: null }).intervalMs === 60_000, false);
  assert.equal(distanceKm(null, { latitude: 10, longitude: 106 }), null);
  const moved = distanceKm({ latitude: 10, longitude: 106 }, { latitude: 10.03, longitude: 106 });
  assert.ok(moved != null && moved > 2);
});

test("assigned driver can upload during transit and the shipper can read it", async () => {
  await withServer(async (baseUrl) => {
    const trip = await transit(baseUrl);
    const tooSoon = await locate(baseUrl, trip.driver, trip.id, new Date().toISOString());
    assert.equal(tooSoon.status, 409);
    const picked = await fetch(`${baseUrl}/api/driver/shipments/${trip.id}/pickup`, {
      method: "POST",
      headers: { "content-type": "application/json", origin: "http://127.0.0.1:5173", cookie: trip.driver },
      body: JSON.stringify({}),
    });
    assert.equal(picked.status, 200);
    const observedAt = new Date().toISOString();
    const uploaded = await locate(baseUrl, trip.driver, trip.id, observedAt, { speedKmh: 42, bearingDeg: 90 });
    assert.equal(uploaded.status, 200);
    const tracking = ((await uploaded.json()) as Json).tracking as Json;
    assert.equal(tracking.phase, "current");
    const location = tracking.location as Json;
    assert.equal(location.latitude, latitude);
    const stored = await Shipment.findById(trip.id);
    assert.equal(stored?.status, "IN_TRANSIT");
    assert.deepEqual(
      stored?.events?.map((event) => event.type),
      ["PUBLISHED", "CLAIMED", "ASSIGNED", "PICKUP_CONFIRMED"],
    );
    const shipperRead = await fetch(`${baseUrl}/api/shipments/${trip.id}/location`, { headers: { cookie: trip.shipper } });
    assert.equal(shipperRead.status, 200);
    const shipperBody = ((await shipperRead.json()) as Json).tracking as Json;
    assert.equal((shipperBody.location as Json).longitude, longitude);
    const repeated = await locate(baseUrl, trip.driver, trip.id, observedAt);
    assert.equal(repeated.status, 409);
    const older = await locate(baseUrl, trip.driver, trip.id, new Date(Date.now() - 60_000).toISOString());
    assert.equal(older.status, 409);
    const after = await Shipment.findById(trip.id);
    assert.equal(after?.latestLocation?.observedAt.toISOString(), observedAt);
  });
});

test("invalid, forged, and unauthorized location writes do not store a position", async () => {
  await withServer(async (baseUrl) => {
    const trip = await transit(baseUrl);
    await fetch(`${baseUrl}/api/driver/shipments/${trip.id}/pickup`, {
      method: "POST",
      headers: { "content-type": "application/json", origin: "http://127.0.0.1:5173", cookie: trip.driver },
      body: JSON.stringify({}),
    });
    const invalid = await locate(baseUrl, trip.driver, trip.id, new Date().toISOString(), { latitude: 95 });
    assert.equal(invalid.status, 400);
    const forged = await locate(baseUrl, trip.driver, trip.id, new Date().toISOString(), { driverId: trip.driverId });
    assert.equal(forged.status, 400);
    const otherDriver = await login(baseUrl, otherDriverEmail);
    const stranger = await locate(baseUrl, otherDriver, trip.id, new Date().toISOString());
    assert.equal(stranger.status, 404);
    const shipperWrite = await locate(baseUrl, trip.shipper, trip.id, new Date().toISOString());
    assert.equal(shipperWrite.status, 403);
    const guest = await fetch(`${baseUrl}/api/driver/shipments/${trip.id}/location`, {
      method: "POST",
      headers: { "content-type": "application/json", origin: "http://127.0.0.1:5173" },
      body: JSON.stringify({ latitude, longitude, observedAt: new Date().toISOString() }),
    });
    assert.equal(guest.status, 401);
    const stored = await Shipment.findById(trip.id).lean();
    assert.equal(stored?.latestLocation, undefined);
    const otherShipper = await login(baseUrl, otherShipperEmail);
    const hidden = await fetch(`${baseUrl}/api/shipments/${trip.id}/location`, { headers: { cookie: otherShipper } });
    assert.equal(hidden.status, 403);
    const admin = await login(baseUrl, adminEmail);
    const adminRead = await fetch(`${baseUrl}/api/shipments/${trip.id}/location`, { headers: { cookie: admin } });
    assert.equal(adminRead.status, 403);
    const carrierRead = await fetch(`${baseUrl}/api/shipments/${trip.id}/location`, { headers: { cookie: trip.carrier } });
    assert.equal(carrierRead.status, 403);
  });
});

test("a newer observation wins and a delivery race cannot accept a later ping", async () => {
  await withServer(async (baseUrl) => {
    const trip = await transit(baseUrl);
    await fetch(`${baseUrl}/api/driver/shipments/${trip.id}/pickup`, {
      method: "POST",
      headers: { "content-type": "application/json", origin: "http://127.0.0.1:5173", cookie: trip.driver },
      body: JSON.stringify({}),
    });
    const earlier = new Date(Date.now() - 5_000).toISOString();
    const later = new Date().toISOString();
    const [first, second] = await Promise.all([
      locate(baseUrl, trip.driver, trip.id, earlier),
      locate(baseUrl, trip.driver, trip.id, later),
    ]);
    assert.ok([200, 409].includes(first.status));
    assert.ok([200, 409].includes(second.status));
    const ordered = await Shipment.findById(trip.id);
    assert.equal(ordered?.latestLocation?.observedAt.toISOString(), later);
    const racingAt = new Date(Date.now() + 1000).toISOString();
    const [delivery, racing] = await Promise.all([
      fetch(`${baseUrl}/api/driver/shipments/${trip.id}/delivery`, {
        method: "POST",
        headers: { "content-type": "application/json", origin: "http://127.0.0.1:5173", cookie: trip.driver },
        body: JSON.stringify({}),
      }),
      locate(baseUrl, trip.driver, trip.id, racingAt),
    ]);
    assert.equal(delivery.status, 200);
    assert.ok([200, 409].includes(racing.status));
    const during = await Shipment.findById(trip.id);
    const acceptedAt = during?.latestLocation?.observedAt.toISOString();
    assert.ok(acceptedAt === later || acceptedAt === racingAt);
    const late = await locate(baseUrl, trip.driver, trip.id, new Date(Date.now() + 1500).toISOString());
    assert.equal(late.status, 409);
    const finished = await Shipment.findById(trip.id);
    assert.equal(finished?.status, "DELIVERY_CONFIRMED");
    assert.equal(finished?.latestLocation?.observedAt.toISOString(), acceptedAt);
    assert.deepEqual(
      finished?.events?.map((event) => event.type),
      ["PUBLISHED", "CLAIMED", "ASSIGNED", "PICKUP_CONFIRMED", "DELIVERY_CONFIRMED"],
    );
    const ended = await fetch(`${baseUrl}/api/shipments/${trip.id}/location`, { headers: { cookie: trip.shipper } });
    const endedBody = ((await ended.json()) as Json).tracking as Json;
    assert.equal(endedBody.phase, "ended");
  });
});

test("open load board and claimed shipment payloads do not include coordinates", async () => {
  await withServer(async (baseUrl) => {
    const trip = await transit(baseUrl);
    const openBefore = await publish(baseUrl, trip.shipper);
    assert.equal(openBefore.status, 201);
    await fetch(`${baseUrl}/api/driver/shipments/${trip.id}/pickup`, {
      method: "POST",
      headers: { "content-type": "application/json", origin: "http://127.0.0.1:5173", cookie: trip.driver },
      body: JSON.stringify({}),
    });
    const uploaded = await locate(baseUrl, trip.driver, trip.id, new Date().toISOString());
    assert.equal(uploaded.status, 200);
    const board = await fetch(`${baseUrl}/api/carrier/shipments`, { headers: { cookie: trip.carrier } });
    const claimed = await fetch(`${baseUrl}/api/carrier/shipments/claimed`, { headers: { cookie: trip.carrier } });
    const detail = await fetch(`${baseUrl}/api/carrier/shipments/${trip.id}`, { headers: { cookie: trip.carrier } });
    assert.equal(board.status, 200);
    assert.equal(claimed.status, 200);
    assert.equal(detail.status, 200);
    assert.equal((await board.text()).includes(String(latitude)), false);
    assert.equal((await claimed.text()).includes(String(latitude)), false);
    assert.equal((await detail.text()).includes(String(latitude)), false);
    const delivered = await fetch(`${baseUrl}/api/driver/shipments/${trip.id}/delivery`, {
      method: "POST",
      headers: { "content-type": "application/json", origin: "http://127.0.0.1:5173", cookie: trip.driver },
      body: JSON.stringify({}),
    });
    assert.equal(delivered.status, 200);
  });
});

test("pickup and delivery succeed when no GPS sample exists", async () => {
  await withServer(async (baseUrl) => {
    const trip = await transit(baseUrl);
    const picked = await fetch(`${baseUrl}/api/driver/shipments/${trip.id}/pickup`, {
      method: "POST",
      headers: { "content-type": "application/json", origin: "http://127.0.0.1:5173", cookie: trip.driver },
      body: JSON.stringify({}),
    });
    assert.equal(picked.status, 200);
    const waiting = await fetch(`${baseUrl}/api/shipments/${trip.id}/location`, { headers: { cookie: trip.shipper } });
    const waitingBody = ((await waiting.json()) as Json).tracking as Json;
    assert.equal(waitingBody.phase, "waiting_for_fix");
    assert.equal(waitingBody.location, null);
    const delivered = await fetch(`${baseUrl}/api/driver/shipments/${trip.id}/delivery`, {
      method: "POST",
      headers: { "content-type": "application/json", origin: "http://127.0.0.1:5173", cookie: trip.driver },
      body: JSON.stringify({}),
    });
    assert.equal(delivered.status, 200);
    const stored = await Shipment.findById(trip.id);
    assert.equal(stored?.status, "DELIVERY_CONFIRMED");
    assert.equal(stored?.latestLocation ?? null, null);
  });
});

test("shipper owner and assigned carrier can read tracking; every other caller is denied", async () => {
  await withServer(async (baseUrl) => {
    const trip = await transit(baseUrl);
    const otherCarrier = await login(baseUrl, otherCarrierEmail);
    const otherShipper = await login(baseUrl, otherShipperEmail);
    const admin = await login(baseUrl, adminEmail);
    const unclaimed = await publish(baseUrl, trip.shipper);
    assert.equal(unclaimed.status, 201);
    const unclaimedId = String((((await unclaimed.json()) as Json).shipment as Json).id);

    const before = await fetch(`${baseUrl}/api/carrier/shipments/${trip.id}/location`, { headers: { cookie: trip.carrier } });
    assert.equal(before.status, 200);
    const beforeBody = ((await before.json()) as Json).tracking as Json;
    assert.equal(beforeBody.phase, "not_started");
    assert.equal(beforeBody.location, null);

    const noClaim = await fetch(`${baseUrl}/api/carrier/shipments/${unclaimedId}/location`, { headers: { cookie: trip.carrier } });
    assert.equal(noClaim.status, 404);
    const otherCarrierRead = await fetch(`${baseUrl}/api/carrier/shipments/${trip.id}/location`, { headers: { cookie: otherCarrier } });
    assert.equal(otherCarrierRead.status, 404);

    await fetch(`${baseUrl}/api/driver/shipments/${trip.id}/pickup`, {
      method: "POST",
      headers: { "content-type": "application/json", origin: "http://127.0.0.1:5173", cookie: trip.driver },
      body: JSON.stringify({}),
    });
    const waiting = await fetch(`${baseUrl}/api/carrier/shipments/${trip.id}/location`, { headers: { cookie: trip.carrier } });
    const waitingBody = ((await waiting.json()) as Json).tracking as Json;
    assert.equal(waitingBody.phase, "waiting_for_fix");
    assert.equal(waitingBody.location, null);

    const uploaded = await locate(baseUrl, trip.driver, trip.id, new Date().toISOString());
    assert.equal(uploaded.status, 200);
    const owner = await fetch(`${baseUrl}/api/shipments/${trip.id}/location`, { headers: { cookie: trip.shipper } });
    const assigned = await fetch(`${baseUrl}/api/carrier/shipments/${trip.id}/location`, { headers: { cookie: trip.carrier } });
    assert.equal(owner.status, 200);
    assert.equal(assigned.status, 200);
    assert.equal((((await owner.json()) as Json).tracking as Json).phase, "current");
    const assignedTracking = ((await assigned.json()) as Json).tracking as Json;
    assert.equal(assignedTracking.phase, "current");
    assert.equal((assignedTracking.location as Json).latitude, latitude);

    await Shipment.updateOne({ _id: trip.id }, { $set: { "latestLocation.receivedAt": new Date(Date.now() - 21 * 60 * 1000) } });
    const stale = await fetch(`${baseUrl}/api/carrier/shipments/${trip.id}/location`, { headers: { cookie: trip.carrier } });
    const staleBody = ((await stale.json()) as Json).tracking as Json;
    assert.equal(staleBody.phase, "stale");
    assert.equal((staleBody.location as Json).longitude, longitude);

    const denied = [
      [`/api/shipments/${trip.id}/location`, otherShipper, 403],
      [`/api/shipments/${trip.id}/location`, trip.carrier, 403],
      [`/api/shipments/${trip.id}/location`, trip.driver, 403],
      [`/api/shipments/${trip.id}/location`, admin, 403],
      [`/api/carrier/shipments/${trip.id}/location`, trip.shipper, 403],
      [`/api/carrier/shipments/${trip.id}/location`, otherShipper, 403],
      [`/api/carrier/shipments/${trip.id}/location`, trip.driver, 403],
      [`/api/carrier/shipments/${trip.id}/location`, admin, 403],
    ] as const;
    for (const [path, cookie, status] of denied) {
      const response = await fetch(`${baseUrl}${path}`, { headers: { cookie } });
      assert.equal(response.status, status);
    }
    const guestShipper = await fetch(`${baseUrl}/api/shipments/${trip.id}/location`);
    const guestCarrier = await fetch(`${baseUrl}/api/carrier/shipments/${trip.id}/location`);
    assert.equal(guestShipper.status, 401);
    assert.equal(guestCarrier.status, 401);

    const board = await fetch(`${baseUrl}/api/carrier/shipments`, { headers: { cookie: trip.carrier } });
    assert.equal((await board.text()).includes(String(latitude)), false);

    const delivered = await fetch(`${baseUrl}/api/driver/shipments/${trip.id}/delivery`, {
      method: "POST",
      headers: { "content-type": "application/json", origin: "http://127.0.0.1:5173", cookie: trip.driver },
      body: JSON.stringify({}),
    });
    assert.equal(delivered.status, 200);
    const ended = await fetch(`${baseUrl}/api/carrier/shipments/${trip.id}/location`, { headers: { cookie: trip.carrier } });
    const endedBody = ((await ended.json()) as Json).tracking as Json;
    assert.equal(endedBody.phase, "ended");
    assert.equal((endedBody.location as Json).latitude, latitude);
    const endedShipper = await fetch(`${baseUrl}/api/shipments/${trip.id}/location`, { headers: { cookie: trip.shipper } });
    assert.equal((((await endedShipper.json()) as Json).tracking as Json).phase, "ended");
  });
});
