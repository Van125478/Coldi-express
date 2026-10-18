import assert from "node:assert/strict";
import { createServer } from "node:http";
import { once } from "node:events";
import test, { after, before } from "node:test";
import mongoose from "mongoose";
import { canonicalPositiveDecimal, redactSecrets } from "../src/market/oil/decimal.js";
import { parseEiaPayload } from "../src/market/oil/eia.js";
import { evaluateFreshness } from "../src/market/oil/freshness.js";
import { readOilPrices } from "../src/market/oil/read.js";
import { nextRunDelayMs, parseSyncTimes, startOilPriceScheduler } from "../src/market/oil/scheduler.js";
import { syncOilPrices } from "../src/market/oil/sync.js";
import { CommissionLedgerEvent } from "../src/models/commissionLedger.js";
import { Incident } from "../src/models/incident.js";
import { OilPriceObservation, OilPriceSyncState, OilSourceSchedule, OilSyncLock } from "../src/models/oilPrice.js";
import { Shipment } from "../src/models/shipment.js";

process.env.PORT ??= "4000";
process.env.FRONTEND_ORIGIN = "http://127.0.0.1:5173";
process.env.NODE_ENV = "test";
process.env.AUTH_SECRET ??= "test-secret-that-is-at-least-32-characters";
process.env.APP_RUNTIME_MODE = "development";
process.env.PACKAGE_DEMO_SELF_ACTIVATION_ENABLED = "false";
process.env.COMMISSION_SIMULATION_ENABLED = "false";
process.env.OIL_SYNC_ENABLED = "false";
delete process.env.EIA_API_KEY;
process.env.MONGODB_URI = "mongodb://127.0.0.1:27017/coldi_oil_price_test";

const databaseName = "coldi_oil_price_test";
const forbidden = new Set(["coldi", "coldi_demo_local", "admin", "local", "config"]);
const { createApp } = await import("../src/app.js");
const secret = "oil-test-key-9f3c";
const origin = "http://127.0.0.1:5173";
const brentUrl = "https://www.eia.gov/dnav/pet/hist/LeafHandler.ashx?n=PET&s=RBRTE&f=D";
const wtiUrl = "https://www.eia.gov/dnav/pet/hist/LeafHandler.ashx?n=PET&s=RWTC&f=D";

type FetchLike = (input: string, init?: { signal?: AbortSignal }) => Promise<Response>;
type OilCard = {
  benchmark: string;
  priceUsdPerBarrel: string | null;
  observedDate: string | null;
  fetchedAt: string | null;
  publishedAt: string | null;
  freshnessStatus: string;
  syncStatus: string;
  sourceUrl: string;
  provider: string | null;
  currency: string;
  unit: string;
  warning: string | null;
};
type OilBody = { disclaimer: string; benchmarks: OilCard[] };

function spot(series: string, rows: Array<{ period: string; value: unknown; units?: unknown; productName?: unknown }>, frequency = "daily") {
  return {
    response: {
      frequency,
      data: rows.map((row) => ({
        period: row.period,
        series,
        value: row.value,
        units: row.units ?? "$/BBL",
        "product-name":
          row.productName ??
          (series === "RWTC" ? "Cushing, OK WTI Spot Price FOB (Dollars per Barrel)" : "Europe Brent Spot Price FOB (Dollars per Barrel)"),
      })),
    },
  };
}

function json(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });
}

function routed(brent: () => Response | Promise<Response>, wti: () => Response | Promise<Response>): FetchLike {
  return async (input) => {
    const url = String(input);
    assert.equal(url.includes(secret), true);
    if (url.includes("RBRTE")) return brent();
    if (url.includes("RWTC")) return wti();
    throw new Error("unexpected upstream url");
  };
}

async function clearOil() {
  await OilPriceObservation.deleteMany({});
  await OilPriceSyncState.deleteMany({});
  await OilSourceSchedule.deleteMany({});
  await OilSyncLock.deleteMany({});
}

async function syncWith(fetchImpl: FetchLike, now = "2026-10-18T02:00:00.000Z") {
  return syncOilPrices({ apiKey: secret, fetchImpl, retryDelaysMs: [0, 0], timeoutMs: 50, now: new Date(now) });
}

function card(body: OilBody, benchmark: string): OilCard {
  const found = body.benchmarks.find((item) => item.benchmark === benchmark);
  assert.ok(found);
  return found;
}

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

before(async () => {
  assert.equal(forbidden.has(databaseName), false);
  assert.equal(new URL(process.env.MONGODB_URI ?? "").pathname, `/${databaseName}`);
  await mongoose.connect(process.env.MONGODB_URI ?? "", { serverSelectionTimeoutMS: 4000 });
  await OilPriceObservation.init();
  await OilPriceSyncState.init();
  await OilSourceSchedule.init();
  await OilSyncLock.init();
  await mongoose.connection.dropDatabase();
});

after(async () => {
  if (mongoose.connection.readyState !== 0 && mongoose.connection.db?.databaseName === databaseName) {
    await mongoose.connection.dropDatabase();
  }
  await mongoose.disconnect();
});

test("decimal parser accepts only finite positive USD amounts", () => {
  assert.equal(canonicalPositiveDecimal("79.30"), "79.3");
  assert.equal(canonicalPositiveDecimal("80.00"), "80");
  assert.equal(canonicalPositiveDecimal("0.10"), "0.1");
  assert.equal(canonicalPositiveDecimal("0"), null);
  assert.equal(canonicalPositiveDecimal("0.00"), null);
  assert.equal(canonicalPositiveDecimal("NaN"), null);
  assert.equal(canonicalPositiveDecimal("Infinity"), null);
  assert.equal(canonicalPositiveDecimal("-1"), null);
  assert.equal(canonicalPositiveDecimal("1e2"), null);
  assert.equal(canonicalPositiveDecimal("12,5"), null);
});

test("freshness follows a verified calendar and stays unknown without one", () => {
  const weekdays = [1, 2, 3, 4, 5];
  const calendar = { verified: true, expectedWeekdays: weekdays, excludedDates: [], deadlineOffsetDays: 0, deadlineMinutesUtc: 18 * 60 };
  assert.equal(evaluateFreshness({ hasObservation: false, observedDate: null, calendar, now: new Date("2026-10-18T00:00:00.000Z") }), "UNAVAILABLE");
  assert.equal(
    evaluateFreshness({ hasObservation: true, observedDate: "2026-10-01", calendar: null, now: new Date("2026-10-18T00:00:00.000Z") }),
    "UNKNOWN",
  );
  assert.equal(
    evaluateFreshness({
      hasObservation: true,
      observedDate: "2026-10-01",
      calendar: { ...calendar, verified: false },
      now: new Date("2026-10-18T00:00:00.000Z"),
    }),
    "UNKNOWN",
  );
  assert.equal(
    evaluateFreshness({ hasObservation: true, observedDate: "2026-10-09", calendar, now: new Date("2026-10-12T10:00:00.000Z") }),
    "FRESH",
  );
  assert.equal(
    evaluateFreshness({ hasObservation: true, observedDate: "2026-10-09", calendar, now: new Date("2026-10-14T19:00:00.000Z") }),
    "STALE",
  );
  assert.equal(
    evaluateFreshness({
      hasObservation: true,
      observedDate: "2026-10-09",
      calendar: { ...calendar, excludedDates: ["2026-10-12"] },
      now: new Date("2026-10-13T19:00:00.000Z"),
    }),
    "FRESH",
  );
  assert.equal(
    evaluateFreshness({
      hasObservation: true,
      observedDate: "2026-10-09",
      calendar,
      now: new Date("2026-10-13T19:00:00.000Z"),
    }),
    "STALE",
  );
});

test("EIA parser rejects malformed, wrong-unit, and non-string prices", () => {
  const valid = parseEiaPayload(spot("RBRTE", [{ period: "2026-10-16", value: "80.50" }]), "RBRTE");
  assert.equal(valid.ok, true);
  if (valid.ok) assert.equal(valid.rows[0]?.priceUsdPerBarrel, "80.5");
  assert.equal(parseEiaPayload("{", "RBRTE").ok, false);
  const missingKey = parseEiaPayload({ error: { code: "API_KEY_MISSING" } }, "RBRTE");
  assert.equal(missingKey.ok, false);
  if (!missingKey.ok) assert.equal(missingKey.code, "CREDENTIALS");
  const numeric = parseEiaPayload(spot("RBRTE", [{ period: "2026-10-16", value: 80.5 }]), "RBRTE");
  assert.equal(numeric.ok, true);
  if (numeric.ok) assert.equal(numeric.rows.length, 0);
  const liveBrent = parseEiaPayload(spot("RBRTE", [{ period: "2026-10-14", value: "80.50", productName: "UK Brent Crude Oil" }]), "RBRTE");
  assert.equal(liveBrent.ok, true);
  if (liveBrent.ok) assert.equal(liveBrent.rows[0]?.priceUsdPerBarrel, "80.5");
  const liveWti = parseEiaPayload(spot("RWTC", [{ period: "2026-10-14", value: "70.25", productName: "WTI Crude Oil" }]), "RWTC");
  assert.equal(liveWti.ok, true);
  if (liveWti.ok) assert.equal(liveWti.rows[0]?.priceUsdPerBarrel, "70.25");
  const diesel = parseEiaPayload(spot("RBRTE", [{ period: "2026-10-14", value: "3.50", productName: "No. 2 Diesel" }]), "RBRTE");
  assert.equal(diesel.ok, true);
  if (diesel.ok) assert.equal(diesel.rejected[0]?.code, "INVALID_UNIT");
  const wrongUnit = parseEiaPayload(spot("RBRTE", [{ period: "2026-10-16", value: "80", units: "cents" }]), "RBRTE");
  assert.equal(wrongUnit.ok, true);
  if (wrongUnit.ok) assert.equal(wrongUnit.rejected[0]?.code, "INVALID_UNIT");
  const badDate = parseEiaPayload(spot("RBRTE", [{ period: "2026-02-31", value: "80" }]), "RBRTE");
  assert.equal(badDate.ok, true);
  if (badDate.ok) assert.equal(badDate.rejected[0]?.code, "INVALID_DATE");
  assert.equal(parseEiaPayload({ response: { frequency: "monthly", data: [] } }, "RBRTE").ok, false);
});

test("sync times are configurable and are not treated as a release calendar", () => {
  assert.deepEqual(parseSyncTimes("18:00, 06:00"), ["06:00", "18:00"]);
  assert.equal(parseSyncTimes("06:00"), null);
  assert.equal(parseSyncTimes("06:00,06:00,12:00"), null);
  assert.equal(parseSyncTimes("06:00,12:00,18:00,23:00,01:00"), null);
  assert.equal(nextRunDelayMs(["06:00", "18:00"], new Date("2026-10-18T05:00:00.000Z")), 60 * 60 * 1000);
  assert.equal(nextRunDelayMs(["06:00", "18:00"], new Date("2026-10-18T06:00:30.000Z")), 1000);
  const stop = startOilPriceScheduler({
    env: { OIL_SYNC_ENABLED: "true", EIA_API_KEY: secret, OIL_SYNC_TIMES: "06:00,18:00" } as NodeJS.ProcessEnv,
    sync: async () => {
      throw new Error("scheduler should have been stopped");
    },
  });
  stop();
  const blocked = startOilPriceScheduler({ env: { OIL_SYNC_ENABLED: "true", EIA_API_KEY: "", OIL_SYNC_TIMES: "06:00,18:00" } as NodeJS.ProcessEnv });
  blocked();
});

test("secret redaction removes the API key from stored text", () => {
  assert.equal(redactSecrets(`request failed for ${secret}`, [secret]).includes(secret), false);
});

test("oil sync, cache, freshness, and public read stay isolated from logistics", async () => {
  await clearOil();
  const shipmentsBefore = await Shipment.countDocuments();
  const commissionBefore = await CommissionLedgerEvent.countDocuments();
  const incidentsBefore = await Incident.countDocuments();

  await withServer(async (baseUrl) => {
    const empty = await fetch(`${baseUrl}/api/market/oil-prices?url=https://evil.example/price`);
    const emptyBody = (await empty.json()) as OilBody;
    assert.equal(empty.status, 200);
    assert.equal(card(emptyBody, "BRENT").priceUsdPerBarrel, null);
    assert.equal(card(emptyBody, "WTI").priceUsdPerBarrel, null);
    assert.equal(card(emptyBody, "BRENT").freshnessStatus, "UNAVAILABLE");
    assert.equal(card(emptyBody, "WTI").freshnessStatus, "UNAVAILABLE");
    assert.equal(card(emptyBody, "BRENT").syncStatus, "NOT_ATTEMPTED");
    assert.equal(emptyBody.benchmarks.some((item) => item.priceUsdPerBarrel === "0"), false);
    assert.equal(card(emptyBody, "BRENT").sourceUrl, brentUrl);
    assert.equal(JSON.stringify(emptyBody).includes("evil.example"), false);
    assert.equal(JSON.stringify(emptyBody).toLowerCase().includes("realtime"), false);

    const denied = await fetch(`${baseUrl}/api/market/oil-prices`, {
      method: "POST",
      headers: { "content-type": "application/json", origin },
      body: JSON.stringify({ priceUsdPerBarrel: "10" }),
    });
    assert.equal(denied.status, 404);
    const login = await fetch(`${baseUrl}/api/auth/login`, {
      method: "POST",
      headers: { "content-type": "application/json", origin },
      body: "{}",
    });
    assert.equal(login.status === 404, false);
    assert.equal(login.status < 500, true);
  });

  const differentDates = await syncWith(
    routed(
      () => json(200, spot("RBRTE", [{ period: "2026-10-16", value: "80.15" }])),
      () => json(200, spot("RWTC", [{ period: "2026-10-15", value: "76.02" }])),
    ),
  );
  assert.equal(differentDates.skipped, false);
  assert.equal(differentDates.benchmarks.every((item) => item.status === "OK"), true);
  const priced = await readOilPrices(new Date("2026-10-18T02:00:00.000Z"));
  assert.equal(card(priced, "BRENT").priceUsdPerBarrel, "80.15");
  assert.equal(card(priced, "BRENT").observedDate, "2026-10-16");
  assert.equal(card(priced, "WTI").observedDate, "2026-10-15");
  assert.equal(card(priced, "BRENT").fetchedAt, "2026-10-18T02:00:00.000Z");
  assert.equal(card(priced, "BRENT").publishedAt, null);
  assert.equal(card(priced, "BRENT").freshnessStatus, "UNKNOWN");
  assert.equal(card(priced, "BRENT").provider, "EIA");
  assert.equal(JSON.stringify(priced).includes(secret), false);

  await syncWith(
    routed(
      () => json(200, spot("RBRTE", [{ period: "2026-10-16", value: "80.15" }])),
      () => json(200, spot("RWTC", [{ period: "2026-10-15", value: "76.02" }])),
    ),
    "2026-10-18T08:00:00.000Z",
  );
  assert.equal(await OilPriceObservation.countDocuments({ seriesId: "RBRTE" }), 1);
  assert.equal((await OilPriceObservation.findOne({ seriesId: "RBRTE" }))?.revision, 1);

  await syncWith(
    routed(
      () => json(200, spot("RBRTE", [{ period: "2026-10-16", value: "81.25" }])),
      () => json(200, spot("RWTC", [{ period: "2026-10-15", value: "76.02" }])),
    ),
  );
  assert.equal(await OilPriceObservation.countDocuments({ seriesId: "RBRTE" }), 2);
  const currentBrent = await OilPriceObservation.findOne({ seriesId: "RBRTE", superseded: false });
  assert.equal(currentBrent?.priceUsdPerBarrel, "81.25");
  assert.equal(currentBrent?.revision, 2);
  assert.equal(await OilPriceObservation.countDocuments({ seriesId: "RBRTE", superseded: true }), 1);

  await syncWith(
    routed(
      () =>
        json(200, spot("RBRTE", [
          { period: "2026-10-15", value: "79.00" },
          { period: "2026-10-16", value: "81.25" },
        ])),
      () => json(200, spot("RWTC", [{ period: "2026-10-15", value: "76.02" }])),
    ),
  );
  const stillCurrent = await readOilPrices();
  assert.equal(card(stillCurrent, "BRENT").observedDate, "2026-10-16");
  assert.equal(card(stillCurrent, "BRENT").priceUsdPerBarrel, "81.25");
  assert.equal((await OilPriceObservation.findOne({ seriesId: "RBRTE", observedDate: "2026-10-15" }))?.priceUsdPerBarrel, "79");

  await syncWith(
    routed(
      () => json(200, spot("RBRTE", [{ period: "2026-10-17", value: "0" }])),
      () => json(200, spot("RWTC", [{ period: "2026-10-17", value: "nope" }])),
    ),
  );
  const preserved = await readOilPrices();
  assert.equal(card(preserved, "BRENT").priceUsdPerBarrel, "81.25");
  assert.equal(card(preserved, "BRENT").observedDate, "2026-10-16");
  assert.equal(card(preserved, "WTI").priceUsdPerBarrel, "76.02");
  assert.equal(card(preserved, "BRENT").syncStatus, "ERROR");

  await syncWith(
    routed(
      () => json(200, spot("RBRTE", [{ period: "2026-10-17", value: "82", units: "USD/liter" }])),
      () => json(200, spot("RWTC", [{ period: "2026-02-31", value: "70" }])),
    ),
  );
  const afterInvalid = await readOilPrices();
  assert.equal(card(afterInvalid, "BRENT").priceUsdPerBarrel, "81.25");
  assert.equal(card(afterInvalid, "WTI").observedDate, "2026-10-15");

  let attempts = 0;
  const recovered = await syncWith(
    routed(
      () => {
        attempts += 1;
        return attempts === 1 ? json(429, { error: "slow down" }) : json(200, spot("RBRTE", [{ period: "2026-10-17", value: "82.10" }]));
      },
      () => json(500, { error: "upstream" }),
    ),
  );
  assert.equal(recovered.benchmarks.find((item) => item.benchmark === "BRENT")?.status, "OK");
  assert.equal(recovered.benchmarks.find((item) => item.benchmark === "WTI")?.status, "ERROR");
  const partial = await readOilPrices();
  assert.equal(card(partial, "BRENT").priceUsdPerBarrel, "82.1");
  assert.equal(card(partial, "BRENT").observedDate, "2026-10-17");
  assert.equal(card(partial, "WTI").priceUsdPerBarrel, "76.02");
  assert.equal(card(partial, "WTI").syncStatus, "ERROR");
  assert.equal(card(partial, "WTI").warning?.includes("gián đoạn"), true);

  await syncWith(routed(() => json(500, { error: "down" }), () => json(500, { error: "down" })));
  const afterOutage = await readOilPrices();
  assert.equal(card(afterOutage, "BRENT").priceUsdPerBarrel, "82.1");
  assert.equal(card(afterOutage, "WTI").priceUsdPerBarrel, "76.02");

  await syncWith(
    routed(
      () => {
        throw new DOMException("timed out", "TimeoutError");
      },
      () => json(200, "not-json") as unknown as Response,
    ),
  );
  const afterTimeout = await readOilPrices();
  assert.equal(card(afterTimeout, "BRENT").priceUsdPerBarrel, "82.1");
  assert.equal(card(afterTimeout, "WTI").priceUsdPerBarrel, "76.02");

  await syncWith(
    routed(
      () => new Response("<<<", { status: 200 }),
      () => json(200, { response: { frequency: "daily", data: [{ value: 1, series: "RWTC" }] } }),
    ),
  );
  const afterSchema = await readOilPrices();
  assert.equal(card(afterSchema, "BRENT").observedDate, "2026-10-17");
  assert.equal(card(afterSchema, "WTI").observedDate, "2026-10-15");

  await clearOil();
  const missingOne = await syncWith(routed(() => json(200, spot("RBRTE", [{ period: "2026-10-16", value: "80" }])), () => json(200, spot("RWTC", []))));
  assert.equal(missingOne.benchmarks.find((item) => item.benchmark === "WTI")?.code, "MISSING");
  const oneSided = await readOilPrices();
  assert.equal(card(oneSided, "BRENT").priceUsdPerBarrel, "80");
  assert.equal(card(oneSided, "WTI").freshnessStatus, "UNAVAILABLE");
  assert.equal(card(oneSided, "WTI").priceUsdPerBarrel, null);

  await clearOil();
  await syncWith(routed(() => json(200, spot("RBRTE", [])), () => json(200, spot("RWTC", []))));
  const none = await readOilPrices();
  assert.equal(card(none, "BRENT").freshnessStatus, "UNAVAILABLE");
  assert.equal(card(none, "WTI").freshnessStatus, "UNAVAILABLE");

  await clearOil();
  await OilSyncLock.create({ _id: "eia-oil-sync", owner: "other-worker", expiresAt: new Date(Date.now() + 60_000) });
  const skipped = await syncWith(routed(() => json(200, spot("RBRTE", [{ period: "2026-10-16", value: "80" }])), () => json(200, spot("RWTC", [{ period: "2026-10-16", value: "70" }]))));
  assert.equal(skipped.skipped, true);
  assert.equal(await OilPriceObservation.countDocuments(), 0);
  await OilSyncLock.deleteMany({});

  let entered = 0;
  let releaseGate = () => {};
  const gate = new Promise<void>((resolve) => {
    releaseGate = resolve;
  });
  const slowFetch: FetchLike = async (input) => {
    entered += 1;
    if (entered === 1) await gate;
    const url = String(input);
    const series = url.includes("RWTC") ? "RWTC" : "RBRTE";
    return json(200, spot(series, [{ period: "2026-10-16", value: series === "RWTC" ? "70" : "80" }]));
  };
  const first = syncOilPrices({ apiKey: secret, fetchImpl: slowFetch, retryDelaysMs: [0], timeoutMs: 1000 });
  while (entered < 1) await new Promise((resolve) => setTimeout(resolve, 10));
  const second = await syncOilPrices({ apiKey: secret, fetchImpl: slowFetch, retryDelaysMs: [0], timeoutMs: 1000 });
  assert.equal(second.skipped, true);
  releaseGate();
  const firstResult = await first;
  assert.equal(firstResult.skipped, false);
  assert.equal(await OilPriceObservation.countDocuments({ seriesId: "RBRTE", superseded: false }), 1);

  await mongoose.disconnect();
  await mongoose.connect(process.env.MONGODB_URI ?? "", { serverSelectionTimeoutMS: 4000 });
  const restored = await readOilPrices();
  assert.equal(card(restored, "BRENT").priceUsdPerBarrel, "80");

  const leaked = await syncOilPrices({
    apiKey: secret,
    retryDelaysMs: [],
    fetchImpl: async () => {
      throw new Error(`boom ${secret}`);
    },
  });
  assert.equal(leaked.benchmarks.every((item) => item.status === "ERROR"), true);
  const storedError = await OilPriceSyncState.findOne({ seriesId: "RBRTE" });
  assert.equal(storedError?.lastErrorMessage?.includes(secret) ?? false, false);
  const publicBody = await readOilPrices();
  assert.equal(JSON.stringify(publicBody).includes(secret), false);
  assert.equal(card(publicBody, "BRENT").priceUsdPerBarrel, "80");

  await OilSourceSchedule.create({
    provider: "EIA",
    seriesId: "RBRTE",
    verified: true,
    frequency: "daily",
    expectedWeekdays: [1, 2, 3, 4, 5],
    excludedDates: [],
    deadlineOffsetDays: 0,
    deadlineMinutesUtc: 18 * 60,
    note: "Test calendar only.",
  });
  await OilPriceObservation.deleteMany({ seriesId: "RBRTE" });
  await OilPriceObservation.create({
    provider: "EIA",
    seriesId: "RBRTE",
    benchmark: "BRENT",
    frequency: "daily",
    observedDate: "2026-10-09",
    priceUsdPerBarrel: "80",
    unit: "barrel",
    currency: "USD",
    sourceUrl: brentUrl,
    fetchedAt: new Date("2026-10-18T02:00:00.000Z"),
    publishedAt: null,
    revision: 1,
    superseded: false,
    validation: { unitsRaw: "$/BBL", schemaVersion: "eia-v2-spot-1" },
  });
  const stale = await readOilPrices(new Date("2026-10-14T19:00:00.000Z"));
  assert.equal(card(stale, "BRENT").freshnessStatus, "STALE");
  assert.equal(card(stale, "BRENT").observedDate, "2026-10-09");
  assert.notEqual(card(stale, "BRENT").observedDate, "2026-10-18");
  assert.equal(card(stale, "WTI").freshnessStatus === "STALE", false);

  await OilSourceSchedule.updateOne({ seriesId: "RBRTE" }, { $set: { verified: false } });
  const unknown = await readOilPrices(new Date("2026-10-14T19:00:00.000Z"));
  assert.equal(card(unknown, "BRENT").freshnessStatus, "UNKNOWN");

  const missingKey = await syncOilPrices({ apiKey: "  ", fetchImpl: async () => json(200, spot("RBRTE", [{ period: "2026-10-16", value: "1" }])) });
  assert.equal(missingKey.benchmarks.every((item) => item.code === "CREDENTIALS"), true);
  assert.equal(card(await readOilPrices(), "BRENT").priceUsdPerBarrel, "80");

  assert.equal(await Shipment.countDocuments(), shipmentsBefore);
  assert.equal(await CommissionLedgerEvent.countDocuments(), commissionBefore);
  assert.equal(await Incident.countDocuments(), incidentsBefore);
  assert.equal(wtiUrl.startsWith("https://www.eia.gov/"), true);
});
