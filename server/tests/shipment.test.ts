import assert from "node:assert/strict";
import { createServer } from "node:http";
import { once } from "node:events";
import test, { before, after } from "node:test";
import mongoose from "mongoose";
import { hashPassword } from "../src/auth/password.js";
import { User } from "../src/models/user.js";

process.env.PORT ??= "4000";
process.env.FRONTEND_ORIGIN ??= "http://127.0.0.1:5173";
process.env.NODE_ENV = "test";
process.env.AUTH_SECRET ??= "test-secret-that-is-at-least-32-characters";

const sourceUri = process.env.MONGODB_URI ?? "mongodb://127.0.0.1:27017/coldi";
const testUri = new URL(sourceUri);
testUri.pathname = "/coldi_shipment_test";
process.env.MONGODB_URI = testUri.toString();

const { createApp } = await import("../src/app.js");

const password = "test-password-123";
const shipperEmail = "shipper.shipment-test@coldi.local";
const otherShipperEmail = "other.shipment-test@coldi.local";
const carrierEmail = "carrier.shipment-test@coldi.local";
const driverEmail = "driver.shipment-test@coldi.local";
const adminEmail = "admin.shipment-test@coldi.local";

const validBody = {
  cargoDescription: "Xoài cát Hòa Lộc",
  pickupLocation: "Cái Bè, Tiền Giang",
  deliveryLocation: "Thủ Đức, TP. Hồ Chí Minh",
  temperatureGroup: "COOL",
  vehicleRequirement: "Xe lạnh 5 tấn",
  listedPriceVnd: 4500000,
};

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

async function publish(baseUrl: string, cookie: string | null, body: unknown, origin = "http://127.0.0.1:5173") {
  return fetch(`${baseUrl}/api/shipments`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      origin,
      ...(cookie ? { cookie } : {}),
    },
    body: JSON.stringify(body),
  });
}

before(async () => {
  await mongoose.connect(process.env.MONGODB_URI ?? "");
  if (mongoose.connection.name !== "coldi_shipment_test") {
    throw new Error(`Refusing to use database ${mongoose.connection.name}.`);
  }
  await mongoose.connection.dropDatabase();
  await User.create([
    { email: shipperEmail, passwordHash: await hashPassword(password), role: "SHIPPER" },
    { email: otherShipperEmail, passwordHash: await hashPassword(password), role: "SHIPPER" },
    { email: carrierEmail, passwordHash: await hashPassword(password), role: "CARRIER" },
    { email: driverEmail, passwordHash: await hashPassword(password), role: "DRIVER" },
    { email: adminEmail, passwordHash: await hashPassword(password), role: "ADMIN" },
  ]);
});

after(async () => {
  if (mongoose.connection.name === "coldi_shipment_test") await mongoose.connection.dropDatabase();
  await mongoose.disconnect();
});

test("a shipper publishes a shipment with status PUBLISHED", async () => {
  await withServer(async (baseUrl) => {
    const cookie = await login(baseUrl, shipperEmail);
    const response = await publish(baseUrl, cookie, { ...validBody, shipperId: "spoof", status: "MATCHED" });
    const body = (await response.json()) as { error?: { code: string } };
    assert.equal(response.status, 400);
    assert.equal(body.error?.code, "invalid_request");

    const created = await publish(baseUrl, cookie, validBody);
    const createdBody = (await created.json()) as { shipment: Json };
    assert.equal(created.status, 201);
    assert.equal(createdBody.shipment.status, "PUBLISHED");
    assert.equal(createdBody.shipment.statusLabel, "Đang tìm xe");
    assert.equal(createdBody.shipment.temperatureLabel, "Lạnh mát");
    assert.equal(createdBody.shipment.listedPriceVnd, 4500000);
    assert.equal("passwordHash" in createdBody.shipment, false);
    assert.equal("_id" in createdBody.shipment, false);
    assert.equal(typeof createdBody.shipment.id, "string");

    const mine = await fetch(`${baseUrl}/api/shipments/mine`, { headers: { cookie } });
    const mineBody = (await mine.json()) as { shipments: Json[] };
    assert.equal(mine.status, 200);
    assert.equal(mineBody.shipments.length, 1);
    assert.equal(mineBody.shipments[0]?.id, createdBody.shipment.id);

    const detail = await fetch(`${baseUrl}/api/shipments/${String(createdBody.shipment.id)}`, { headers: { cookie } });
    assert.equal(detail.status, 200);

    const otherCookie = await login(baseUrl, otherShipperEmail);
    const denied = await fetch(`${baseUrl}/api/shipments/${String(createdBody.shipment.id)}`, { headers: { cookie: otherCookie } });
    assert.equal(denied.status, 403);
    const otherMine = await fetch(`${baseUrl}/api/shipments/mine`, { headers: { cookie: otherCookie } });
    const otherMineBody = (await otherMine.json()) as { shipments: unknown[] };
    assert.deepEqual(otherMineBody.shipments, []);
  });
});

test("anonymous and non-shipper roles cannot publish", async () => {
  await withServer(async (baseUrl) => {
    const anonymous = await publish(baseUrl, null, validBody);
    assert.equal(anonymous.status, 401);
    for (const email of [carrierEmail, driverEmail, adminEmail]) {
      const cookie = await login(baseUrl, email);
      const response = await publish(baseUrl, cookie, validBody);
      assert.equal(response.status, 403);
    }
  });
});

test("required fields, temperature, and price are validated", async () => {
  await withServer(async (baseUrl) => {
    const cookie = await login(baseUrl, shipperEmail);
    const missing = await publish(baseUrl, cookie, { temperatureGroup: "COOL", listedPriceVnd: 1000 });
    const missingBody = (await missing.json()) as { error: { fields: Record<string, string> } };
    assert.equal(missing.status, 400);
    assert.equal(typeof missingBody.error.fields.cargoDescription, "string");

    const temperature = await publish(baseUrl, cookie, { ...validBody, temperatureGroup: "MINUS_18" });
    assert.equal(temperature.status, 400);

    for (const listedPriceVnd of [-1, 1.5, 0, "4500000"]) {
      const price = await publish(baseUrl, cookie, { ...validBody, listedPriceVnd });
      assert.equal(price.status, 400);
    }

    const missingId = await fetch(`${baseUrl}/api/shipments/not-an-id`, { headers: { cookie } });
    assert.equal(missingId.status, 404);
  });
});
