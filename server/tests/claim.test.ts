import assert from "node:assert/strict";
import { createServer } from "node:http";
import { once } from "node:events";
import test, { before, after } from "node:test";
import mongoose from "mongoose";
import { hashPassword } from "../src/auth/password.js";
import { Shipment } from "../src/models/shipment.js";
import { User } from "../src/models/user.js";

process.env.PORT ??= "4000";
process.env.FRONTEND_ORIGIN ??= "http://127.0.0.1:5173";
process.env.NODE_ENV = "test";
process.env.AUTH_SECRET ??= "test-secret-that-is-at-least-32-characters";

const sourceUri = process.env.MONGODB_URI ?? "mongodb://127.0.0.1:27017/coldi";
const testUri = new URL(sourceUri);
testUri.pathname = "/coldi_claim_test";
process.env.MONGODB_URI = testUri.toString();

const { createApp } = await import("../src/app.js");

const password = "test-password-123";
const shipperEmail = "shipper.claim-test@coldi.local";
const otherShipperEmail = "other.claim-test@coldi.local";
const carrierEmail = "carrier.claim-test@coldi.local";
const otherCarrierEmail = "other-carrier.claim-test@coldi.local";
const driverEmail = "driver.claim-test@coldi.local";
const adminEmail = "admin.claim-test@coldi.local";

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

function claim(baseUrl: string, cookie: string | null, id: string, body: unknown = {}) {
  return fetch(`${baseUrl}/api/carrier/shipments/${id}/claim`, {
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
  if (mongoose.connection.name !== "coldi_claim_test") {
    throw new Error(`Refusing to use database ${mongoose.connection.name}.`);
  }
  await mongoose.connection.dropDatabase();
  await User.create([
    { email: shipperEmail, passwordHash: await hashPassword(password), role: "SHIPPER" },
    { email: otherShipperEmail, passwordHash: await hashPassword(password), role: "SHIPPER" },
    { email: carrierEmail, passwordHash: await hashPassword(password), role: "CARRIER" },
    { email: otherCarrierEmail, passwordHash: await hashPassword(password), role: "CARRIER" },
    { email: driverEmail, passwordHash: await hashPassword(password), role: "DRIVER" },
    { email: adminEmail, passwordHash: await hashPassword(password), role: "ADMIN" },
  ]);
});

after(async () => {
  if (mongoose.connection.name === "coldi_claim_test") await mongoose.connection.dropDatabase();
  await mongoose.disconnect();
});

test("only a carrier can list published shipments", async () => {
  await withServer(async (baseUrl) => {
    const shipperCookie = await login(baseUrl, shipperEmail);
    const first = await publish(baseUrl, shipperCookie, "Tôm sú đông lạnh");
    await publish(baseUrl, shipperCookie, "Xoài cát");
    assert.equal(first.carrierId, null);
    assert.equal("shipperId" in first, true);

    const anonymous = await fetch(`${baseUrl}/api/carrier/shipments`);
    assert.equal(anonymous.status, 401);
    for (const email of [shipperEmail, driverEmail, adminEmail]) {
      const cookie = await login(baseUrl, email);
      const denied = await fetch(`${baseUrl}/api/carrier/shipments`, { headers: { cookie } });
      assert.equal(denied.status, 403);
    }

    const carrierCookie = await login(baseUrl, carrierEmail);
    const board = await fetch(`${baseUrl}/api/carrier/shipments`, { headers: { cookie: carrierCookie } });
    const body = (await board.json()) as { shipments: Json[] };
    assert.equal(board.status, 200);
    assert.deepEqual(
      body.shipments.map((item) => item.cargoDescription),
      ["Tôm sú đông lạnh", "Xoài cát"],
    );
    assert.equal(body.shipments.every((item) => item.status === "PUBLISHED" && !("shipperId" in item)), true);
  });
});

test("a carrier claim is exclusive and visible to the owning shipper", async () => {
  await withServer(async (baseUrl) => {
    const shipperCookie = await login(baseUrl, shipperEmail);
    const created = await publish(baseUrl, shipperCookie, "Cá hồi đông");
    const id = String(created.id);
    const carrier = await User.findOne({ email: carrierEmail });
    assert.ok(carrier);

    const spoof = await claim(baseUrl, await login(baseUrl, carrierEmail), id, { carrierId: "spoof" });
    assert.equal(spoof.status, 400);
    const stillOpen = await Shipment.findById(id);
    assert.equal(stillOpen?.status, "PUBLISHED");
    assert.equal(stillOpen?.carrierId, undefined);

    const shipperClaim = await claim(baseUrl, shipperCookie, id);
    assert.equal(shipperClaim.status, 403);

    const claimed = await claim(baseUrl, await login(baseUrl, carrierEmail), id);
    const claimedBody = (await claimed.json()) as { shipment: Json };
    assert.equal(claimed.status, 200);
    assert.equal(claimedBody.shipment.status, "MATCHED");
    assert.equal(claimedBody.shipment.statusLabel, "Đã có nhà xe nhận chuyến");
    assert.equal(claimedBody.shipment.carrierId, carrier._id.toString());
    assert.equal("vehicleId" in claimedBody.shipment, false);
    assert.equal("driverId" in claimedBody.shipment, false);

    const again = await claim(baseUrl, await login(baseUrl, otherCarrierEmail), id);
    assert.equal(again.status, 409);
    const missing = await claim(baseUrl, await login(baseUrl, carrierEmail), "507f1f77bcf86cd799439011");
    assert.equal(missing.status, 404);

    const owner = await fetch(`${baseUrl}/api/shipments/${id}`, { headers: { cookie: shipperCookie } });
    const ownerBody = (await owner.json()) as { shipment: Json };
    assert.equal(owner.status, 200);
    assert.equal(ownerBody.shipment.status, "MATCHED");
    const otherShipper = await fetch(`${baseUrl}/api/shipments/${id}`, {
      headers: { cookie: await login(baseUrl, otherShipperEmail) },
    });
    assert.equal(otherShipper.status, 403);

    const board = await fetch(`${baseUrl}/api/carrier/shipments`, {
      headers: { cookie: await login(baseUrl, carrierEmail) },
    });
    const boardBody = (await board.json()) as { shipments: Json[] };
    assert.equal(boardBody.shipments.some((item) => item.id === id), false);
  });
});

test("two concurrent claims produce one winner", async () => {
  await withServer(async (baseUrl) => {
    const created = await publish(baseUrl, await login(baseUrl, shipperEmail), "Hàng tranh chấp");
    const id = String(created.id);
    const firstCookie = await login(baseUrl, carrierEmail);
    const secondCookie = await login(baseUrl, otherCarrierEmail);
    const [first, second] = await Promise.all([claim(baseUrl, firstCookie, id), claim(baseUrl, secondCookie, id)]);
    const statuses = [first.status, second.status].sort((left, right) => left - right);
    assert.deepEqual(statuses, [200, 409]);

    const stored = await Shipment.findById(id);
    assert.equal(stored?.status, "MATCHED");
    assert.ok(stored?.carrierId);
    const winners = await Shipment.countDocuments({ _id: id, status: "MATCHED" });
    assert.equal(winners, 1);
  });
});
