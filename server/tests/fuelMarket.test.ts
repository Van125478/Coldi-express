import assert from "node:assert/strict";
import { createServer } from "node:http";
import { once } from "node:events";
import test, { after, before } from "node:test";
import mongoose from "mongoose";
import { hashPassword } from "../src/auth/password.js";
import { dieselUnavailableMessage } from "../src/market/diesel/policy.js";
import { DieselPublication } from "../src/models/dieselPrice.js";
import { CommissionLedgerEvent } from "../src/models/commissionLedger.js";
import { Shipment } from "../src/models/shipment.js";
import { User } from "../src/models/user.js";

process.env.PORT ??= "4000";
process.env.FRONTEND_ORIGIN = "http://127.0.0.1:5173";
process.env.NODE_ENV = "test";
process.env.AUTH_SECRET ??= "test-secret-that-is-at-least-32-characters";
process.env.APP_RUNTIME_MODE = "development";
process.env.PACKAGE_DEMO_SELF_ACTIVATION_ENABLED = "false";
process.env.COMMISSION_SIMULATION_ENABLED = "false";
process.env.OIL_SYNC_ENABLED = "false";
delete process.env.EIA_API_KEY;
process.env.MONGODB_URI = "mongodb://127.0.0.1:27017/coldi_fuel_market_test";

const databaseName = "coldi_fuel_market_test";
const forbidden = new Set(["coldi", "coldi_demo_local", "admin", "local", "config"]);
const { createApp } = await import("../src/app.js");
const origin = "http://127.0.0.1:5173";
const password = "test-password-123";
const adminEmail = "admin.fuel-test@coldi.local";
const shipperEmail = "shipper.fuel-test@coldi.local";

type FuelBody = {
  diesel: {
    available: boolean;
    priceVndPerLitre: number | null;
    message: string | null;
    documentNumber: string | null;
    latestKnownDocument: { number: string };
  };
  oil: { benchmarks: { priceUsdPerBarrel: string | null }[] };
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
    headers: { "content-type": "application/json", origin },
    body: JSON.stringify({ email, password }),
  });
  assert.equal(response.status, 200);
  return (response.headers.getSetCookie().find((value) => value.startsWith("coldi_session=")) ?? "").split(";")[0] ?? "";
}

before(async () => {
  await mongoose.connect(process.env.MONGODB_URI ?? "");
  if (mongoose.connection.name !== databaseName || forbidden.has(mongoose.connection.name)) {
    throw new Error(`Refusing to use database ${mongoose.connection.name}.`);
  }
  await mongoose.connection.dropDatabase();
  const passwordHash = await hashPassword(password);
  await User.create([
    { email: adminEmail, passwordHash, role: "ADMIN" },
    { email: shipperEmail, passwordHash, role: "SHIPPER" },
  ]);
});

after(async () => {
  if (mongoose.connection.name === databaseName && !forbidden.has(mongoose.connection.name)) await mongoose.connection.dropDatabase();
  await mongoose.disconnect();
});

test("diesel stays unpublished until an admin verifies an official document", async () => {
  const shipmentsBefore = await Shipment.countDocuments();
  const commissionBefore = await CommissionLedgerEvent.countDocuments();
  await withServer(async (baseUrl) => {
    const empty = await fetch(`${baseUrl}/api/market/fuel`);
    const body = (await empty.json()) as FuelBody;
    assert.equal(empty.status, 200);
    assert.equal(body.diesel.available, false);
    assert.equal(body.diesel.priceVndPerLitre, null);
    assert.equal(body.diesel.message, dieselUnavailableMessage);
    assert.equal(body.diesel.latestKnownDocument.number, "8480/BCT-TTTN");
    assert.equal(JSON.stringify(body).includes("29128"), false);
    assert.equal(body.oil.benchmarks.length, 2);

    const guestWrite = await fetch(`${baseUrl}/api/market/fuel/diesel`, {
      method: "POST",
      headers: { "content-type": "application/json", origin },
      body: JSON.stringify({ product: "DIESEL_005S", priceVndPerLitre: 29128 }),
    });
    assert.equal(guestWrite.status, 401);
    const shipper = await login(baseUrl, shipperEmail);
    const shipperWrite = await fetch(`${baseUrl}/api/market/fuel/diesel`, {
      method: "POST",
      headers: { "content-type": "application/json", origin, cookie: shipper },
      body: JSON.stringify({
        product: "DIESEL_005S",
        priceKind: "OFFICIAL_CEILING",
        priceVndPerLitre: 29128,
        documentNumber: "8177/BCT-TTTN",
        sourceUrl: "https://moit.gov.vn/van-ban-phap-luat/van-ban-dieu-hanh",
        announcedOn: "2026-10-08",
        effectiveAt: "2026-10-08T08:00:00.000Z",
      }),
    });
    assert.equal(shipperWrite.status, 403);

    const admin = await login(baseUrl, adminEmail);
    const badSource = await fetch(`${baseUrl}/api/market/fuel/diesel`, {
      method: "POST",
      headers: { "content-type": "application/json", origin, cookie: admin },
      body: JSON.stringify({
        product: "DIESEL_005S",
        priceKind: "OFFICIAL_CEILING",
        priceVndPerLitre: 29128,
        documentNumber: "8480/BCT-TTTN",
        sourceUrl: "https://example.com/diesel",
        announcedOn: "2026-10-15",
        effectiveAt: "2026-10-15T08:00:00.000Z",
      }),
    });
    assert.equal(badSource.status, 400);
    assert.equal((await DieselPublication.countDocuments()), 0);

    const published = await fetch(`${baseUrl}/api/market/fuel/diesel`, {
      method: "POST",
      headers: { "content-type": "application/json", origin, cookie: admin },
      body: JSON.stringify({
        product: "DIESEL_005S",
        priceKind: "OFFICIAL_CEILING",
        priceVndPerLitre: 28000,
        documentNumber: "TEST-VERIFY-01",
        sourceUrl: "https://minhbach.moit.gov.vn/",
        announcedOn: "2026-10-15",
        effectiveAt: "2026-10-15T08:00:00.000Z",
        note: "Giá kiểm thử đã xác minh, không phải giá kỳ 8480.",
      }),
    });
    assert.equal(published.status, 201);
    const after = (await (await fetch(`${baseUrl}/api/market/fuel`)).json()) as FuelBody;
    assert.equal(after.diesel.available, true);
    assert.equal(after.diesel.priceVndPerLitre, 28000);
    assert.equal(after.diesel.documentNumber, "TEST-VERIFY-01");
  });
  assert.equal(await Shipment.countDocuments(), shipmentsBefore);
  assert.equal(await CommissionLedgerEvent.countDocuments(), commissionBefore);
});
