import assert from "node:assert/strict";
import { createServer } from "node:http";
import { once } from "node:events";
import os from "node:os";
import path from "node:path";
import test, { before, after } from "node:test";
import mongoose from "mongoose";
import { hashPassword } from "../src/auth/password.js";
import { TINY_PNG } from "./support/cargoImage.js";
import { storeIncidentEvidence } from "../src/incidents/evidence.js";
import { HttpError } from "../src/middlewares/errorHandler.js";
import { CommissionLedgerEvent } from "../src/models/commissionLedger.js";
import { Incident } from "../src/models/incident.js";
import { IncidentEvent } from "../src/models/incidentEvent.js";
import { IncidentEvidence } from "../src/models/incidentEvidence.js";
import { PlanAuditEvent } from "../src/models/package.js";
import { Shipment } from "../src/models/shipment.js";
import { User } from "../src/models/user.js";

process.env.PORT ??= "4000";
process.env.FRONTEND_ORIGIN = "http://127.0.0.1:5173";
process.env.NODE_ENV = "test";
process.env.AUTH_SECRET ??= "test-secret-that-is-at-least-32-characters";
process.env.APP_RUNTIME_MODE = "development";
process.env.PACKAGE_DEMO_SELF_ACTIVATION_ENABLED = "false";
process.env.COMMISSION_SIMULATION_ENABLED = "false";
process.env.INCIDENT_EVIDENCE_DIR = path.join(os.tmpdir(), "coldi-incident-resolution-photo-test");
process.env.MONGODB_URI = "mongodb://127.0.0.1:27017/coldi_incident_resolution_photo_test";

const databaseName = "coldi_incident_resolution_photo_test";
const forbidden = new Set(["coldi", "coldi_demo_local", "admin", "local", "config"]);
const { createApp } = await import("../src/app.js");

const password = "test-password-123";
const origin = "http://127.0.0.1:5173";
const summary = "Đã thay lốp dự phòng và xe tiếp tục hành trình.";
const emails = {
  shipper: "shipper.resolution-photo@coldi.local",
  carrier: "carrier.resolution-photo@coldi.local",
  otherCarrier: "other-carrier.resolution-photo@coldi.local",
  driver: "driver.resolution-photo@coldi.local",
  admin: "admin.resolution-photo@coldi.local",
} as const;

type Who = keyof typeof emails;
type Json = Record<string, unknown>;
type IncidentBody = {
  incident?: { id: string; version: number; status: string; resolutionSummary?: string | null; attachments?: { id: string }[] };
  events?: { action: string; note: string | null; evidence?: { id: string }[]; actorRole: string; occurredAt: string }[];
  error?: { code?: string };
};

const ids: Record<string, string> = {};
let sequence = 0;

function nextKey(prefix: string): string {
  sequence += 1;
  return `${prefix}-${sequence}-photo`.slice(0, 80);
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

async function login(baseUrl: string, email: string): Promise<string> {
  const response = await fetch(`${baseUrl}/api/auth/login`, {
    method: "POST",
    headers: { "content-type": "application/json", origin },
    body: JSON.stringify({ email, password }),
  });
  assert.equal(response.status, 200);
  const cookie = response.headers.getSetCookie().find((value) => value.startsWith("coldi_session="));
  assert.ok(cookie);
  return cookie.split(";")[0] ?? "";
}

function request(baseUrl: string, pathName: string, cookie: string | null, method = "GET", body?: unknown) {
  return fetch(`${baseUrl}${pathName}`, {
    method,
    headers: {
      origin,
      ...(body === undefined ? {} : { "content-type": "application/json" }),
      ...(cookie ? { cookie } : {}),
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
}

async function upload(baseUrl: string, cookie: string, bytes: Buffer = TINY_PNG, type = "image/png"): Promise<{ status: number; id: string }> {
  const response = await fetch(`${baseUrl}/api/incident-evidence`, {
    method: "POST",
    headers: { origin, cookie, "content-type": type },
    body: bytes,
  });
  if (response.status !== 201) return { status: response.status, id: "" };
  const id = String(((await response.json()) as { image: { id: string } }).image.id);
  return { status: 201, id };
}

async function seedShipment() {
  const shipment = await Shipment.create({
    shipperId: ids.shipper,
    cargoDescription: "Hàng lạnh kiểm thử ảnh kết quả",
    pickupLocation: "Kho A",
    deliveryLocation: "Kho B",
    temperatureGroup: "FROZEN",
    vehicleRequirement: "Xe đông lạnh",
    listedPriceVnd: 1500000,
    status: "MATCHED",
    carrierId: ids.carrier,
    driverId: ids.driver,
  });
  return shipment._id.toString();
}

async function postIncident(baseUrl: string, cookie: string, shipmentId: string, evidenceIds?: string[]) {
  const response = await request(baseUrl, "/api/incidents", cookie, "POST", {
    shipmentId,
    incidentType: "VEHICLE_ISSUE",
    title: "Xe bị lủng lốp",
    description: "Xe bị lủng lốp trên quốc lộ, tài xế đang chờ thay lốp dự phòng.",
    idempotencyKey: nextKey("create"),
    ...(evidenceIds ? { evidenceIds } : {}),
  });
  const body = (await response.json()) as IncidentBody;
  assert.equal(response.status, 201);
  assert.ok(body.incident);
  return body.incident;
}

async function act(baseUrl: string, cookie: string, id: string, pathName: string, extra: Json = {}, key = nextKey(pathName)) {
  const incident = await Incident.findById(id).lean();
  assert.ok(incident);
  const response = await request(baseUrl, `/api/incidents/${id}/${pathName}`, cookie, "POST", {
    expectedVersion: incident.version,
    idempotencyKey: key,
    ...extra,
  });
  const body = (await response.json()) as IncidentBody;
  return { response, body, key };
}

async function progress(baseUrl: string, carrier: string, shipper: string) {
  const shipmentId = await seedShipment();
  const created = await postIncident(baseUrl, shipper, shipmentId);
  assert.equal((await act(baseUrl, carrier, created.id, "acknowledge")).response.status, 200);
  assert.equal((await act(baseUrl, carrier, created.id, "start", { note: "Đang điều xe cứu hộ thay lốp." })).response.status, 200);
  return { id: created.id, shipmentId };
}

function resolvedEvents(body: IncidentBody) {
  return (body.events ?? []).filter((event) => event.action === "RESOLVED");
}

before(async () => {
  await mongoose.connect(process.env.MONGODB_URI ?? "");
  if (mongoose.connection.name !== databaseName || forbidden.has(mongoose.connection.name)) {
    throw new Error(`Refusing to use database ${mongoose.connection.name}.`);
  }
  await mongoose.connection.dropDatabase();
  const passwordHash = await hashPassword(password);
  const carrier = await User.create({ email: emails.carrier, passwordHash, role: "CARRIER" });
  await User.create([
    { email: emails.shipper, passwordHash, role: "SHIPPER" },
    { email: emails.otherCarrier, passwordHash, role: "CARRIER" },
    { email: emails.driver, passwordHash, role: "DRIVER", carrierId: carrier._id, displayName: "Tài xế", mustChangePassword: false },
    { email: emails.admin, passwordHash, role: "ADMIN" },
  ]);
  for (const who of Object.keys(emails) as Who[]) {
    ids[who] = (await User.findOne({ email: emails[who] }))?._id.toString() ?? "";
    assert.ok(ids[who], who);
  }
});

after(async () => {
  if (mongoose.connection.name === databaseName && !forbidden.has(mongoose.connection.name)) await mongoose.connection.dropDatabase();
  await mongoose.disconnect();
});

test("incident resolution photo evidence", { concurrency: false }, async (t) => {
  await t.test("text-only resolution succeeds and leaves shipment, package, and commission unchanged", async () => {
    await withServer(async (baseUrl) => {
      const carrier = await login(baseUrl, emails.carrier);
      const shipper = await login(baseUrl, emails.shipper);
      const { id, shipmentId } = await progress(baseUrl, carrier, shipper);
      const before = await Shipment.findById(shipmentId).lean();
      const ledgerBefore = await CommissionLedgerEvent.countDocuments();
      const auditBefore = await PlanAuditEvent.countDocuments();
      const resolved = await act(baseUrl, carrier, id, "resolve", { resolutionSummary: summary });
      assert.equal(resolved.response.status, 200);
      assert.equal(resolved.body.incident?.status, "RESOLVED");
      assert.equal(resolved.body.incident?.resolutionSummary, summary);
      const viewed = await request(baseUrl, `/api/incidents/${id}`, shipper);
      const body = (await viewed.json()) as IncidentBody;
      assert.equal(viewed.status, 200);
      const event = resolvedEvents(body).at(-1);
      assert.equal(event?.note, summary);
      assert.deepEqual(event?.evidence, []);
      assert.equal(JSON.stringify(body).includes("storageKey"), false);
      const after = await Shipment.findById(shipmentId).lean();
      assert.equal(after?.status, before?.status);
      assert.equal(after?.listedPriceVnd, before?.listedPriceVnd);
      assert.equal(String(after?.carrierId), String(before?.carrierId));
      assert.equal(await CommissionLedgerEvent.countDocuments(), ledgerBefore);
      assert.equal(await PlanAuditEvent.countDocuments(), auditBefore);
    });
  });

  await t.test("one to five valid images attach to that resolution only", async () => {
    await withServer(async (baseUrl) => {
      const carrier = await login(baseUrl, emails.carrier);
      const shipper = await login(baseUrl, emails.shipper);
      const { id } = await progress(baseUrl, carrier, shipper);
      const single = await upload(baseUrl, carrier);
      assert.equal(single.status, 201);
      const first = await act(baseUrl, carrier, id, "resolve", { resolutionSummary: summary, evidenceIds: [single.id] });
      assert.equal(first.response.status, 200);
      const viewed = (await (await request(baseUrl, `/api/incidents/${id}`, shipper)).json()) as IncidentBody;
      assert.deepEqual(resolvedEvents(viewed).at(-1)?.evidence, [{ id: single.id }]);
      assert.deepEqual(viewed.incident?.attachments, []);
      const image = await fetch(`${baseUrl}/api/incident-evidence/${single.id}`, { headers: { cookie: shipper } });
      assert.equal(image.status, 200);
      assert.equal(image.headers.get("content-type"), "image/png");
      assert.equal(Buffer.compare(Buffer.from(await image.arrayBuffer()), TINY_PNG), 0);

      const secondCase = await progress(baseUrl, carrier, shipper);
      const many: string[] = [];
      for (let index = 0; index < 5; index += 1) {
        const uploaded = await upload(baseUrl, carrier);
        assert.equal(uploaded.status, 201);
        many.push(uploaded.id);
      }
      const resolved = await act(baseUrl, carrier, secondCase.id, "resolve", { resolutionSummary: summary, evidenceIds: many });
      assert.equal(resolved.response.status, 200);
      const again = (await (await request(baseUrl, `/api/incidents/${secondCase.id}`, carrier)).json()) as IncidentBody;
      assert.deepEqual(resolvedEvents(again).at(-1)?.evidence?.map((item) => item.id), many);
    });
  });

  await t.test("more than five images, unsupported files, and oversized files are rejected", async () => {
    await withServer(async (baseUrl) => {
      const carrier = await login(baseUrl, emails.carrier);
      const shipper = await login(baseUrl, emails.shipper);
      const { id } = await progress(baseUrl, carrier, shipper);
      const before = await Incident.findById(id).lean();
      const tooMany = await act(baseUrl, carrier, id, "resolve", {
        resolutionSummary: summary,
        evidenceIds: Array.from({ length: 6 }, (_item, index) => `${index}`.padStart(24, "a")),
      });
      assert.equal(tooMany.response.status, 400);
      assert.equal((await Incident.findById(id).lean())?.status, before?.status);
      const gif = await upload(baseUrl, carrier, Buffer.from("GIF89a"), "image/gif");
      assert.equal(gif.status, 400);
      const fake = await upload(baseUrl, carrier, Buffer.from("not-an-image"), "image/png");
      assert.equal(fake.status, 400);
      const oversized = await upload(baseUrl, carrier, Buffer.alloc(2_000_001), "image/png");
      assert.equal(oversized.status, 413);
      await assert.rejects(() => storeIncidentEvidence(ids.carrier, "image/png", Buffer.alloc(2_000_001)), (error: unknown) => error instanceof HttpError && error.status === 400);
    });
  });

  await t.test("foreign, reused, and unauthorized evidence ids are rejected", async () => {
    await withServer(async (baseUrl) => {
      const carrier = await login(baseUrl, emails.carrier);
      const shipper = await login(baseUrl, emails.shipper);
      const shipmentId = await seedShipment();
      const reportImage = await upload(baseUrl, shipper);
      assert.equal(reportImage.status, 201);
      const created = await postIncident(baseUrl, shipper, shipmentId, [reportImage.id]);
      assert.deepEqual(created.attachments, [{ id: reportImage.id }]);
      assert.equal((await act(baseUrl, carrier, created.id, "acknowledge")).response.status, 200);
      assert.equal((await act(baseUrl, carrier, created.id, "start", { note: "Đang xử lý tại hiện trường." })).response.status, 200);
      const foreign = await upload(baseUrl, shipper);
      const rejected = await act(baseUrl, carrier, created.id, "resolve", { resolutionSummary: summary, evidenceIds: [foreign.id] });
      assert.equal(rejected.response.status, 400);
      assert.equal((await Incident.findById(created.id).lean())?.status, "IN_PROGRESS");
      assert.equal((await IncidentEvidence.findById(foreign.id).lean())?.incidentId, null);
      const reused = await act(baseUrl, carrier, created.id, "resolve", { resolutionSummary: summary, evidenceIds: [reportImage.id] });
      assert.equal(reused.response.status, 400);
      assert.equal(String((await IncidentEvidence.findById(reportImage.id).lean())?.incidentId), created.id);
      const missing = await act(baseUrl, carrier, created.id, "resolve", { resolutionSummary: summary, evidenceIds: ["b".repeat(24)] });
      assert.equal(missing.response.status, 400);
      assert.equal((await Incident.findById(created.id).lean())?.status, "IN_PROGRESS");
    });
  });

  await t.test("the wrong role or the wrong status cannot attach resolution images", async () => {
    await withServer(async (baseUrl) => {
      const carrier = await login(baseUrl, emails.carrier);
      const shipper = await login(baseUrl, emails.shipper);
      const driver = await login(baseUrl, emails.driver);
      const admin = await login(baseUrl, emails.admin);
      const { id } = await progress(baseUrl, carrier, shipper);
      const shipperImage = await upload(baseUrl, shipper);
      const shipperAttempt = await act(baseUrl, shipper, id, "resolve", { resolutionSummary: summary, evidenceIds: [shipperImage.id] });
      assert.equal(shipperAttempt.response.status, 403);
      const driverImage = await upload(baseUrl, driver);
      const driverAttempt = await act(baseUrl, driver, id, "resolve", { resolutionSummary: summary, evidenceIds: [driverImage.id] });
      assert.equal(driverAttempt.response.status, 403);
      const adminImage = await upload(baseUrl, carrier);
      const adminAttempt = await act(baseUrl, admin, id, "resolve", { resolutionSummary: summary, evidenceIds: [adminImage.id] });
      assert.equal(adminAttempt.response.status, 404);
      assert.equal((await Incident.findById(id).lean())?.status, "IN_PROGRESS");
      for (const imageId of [shipperImage.id, driverImage.id, adminImage.id]) {
        assert.equal((await IncidentEvidence.findById(imageId).lean())?.incidentId, null);
      }
      const opened = await postIncident(baseUrl, shipper, await seedShipment());
      const early = await upload(baseUrl, carrier);
      const earlyAttempt = await act(baseUrl, carrier, opened.id, "resolve", { resolutionSummary: summary, evidenceIds: [early.id] });
      assert.equal(earlyAttempt.response.status, 409);
      assert.equal((await Incident.findById(opened.id).lean())?.status, "OPEN");
      assert.equal((await IncidentEvidence.findById(early.id).lean())?.incidentId, null);
    });
  });

  await t.test("the same idempotency key does not duplicate the event or the image association", async () => {
    await withServer(async (baseUrl) => {
      const carrier = await login(baseUrl, emails.carrier);
      const shipper = await login(baseUrl, emails.shipper);
      const { id } = await progress(baseUrl, carrier, shipper);
      const image = await upload(baseUrl, carrier);
      const key = nextKey("same-resolution");
      const incident = await Incident.findById(id).lean();
      assert.ok(incident);
      const payload = { expectedVersion: incident.version, idempotencyKey: key, resolutionSummary: summary, evidenceIds: [image.id] };
      const first = await request(baseUrl, `/api/incidents/${id}/resolve`, carrier, "POST", payload);
      assert.equal(first.status, 200);
      const second = await request(baseUrl, `/api/incidents/${id}/resolve`, carrier, "POST", { ...payload, expectedVersion: incident.version });
      assert.equal(second.status, 200);
      const other = await upload(baseUrl, carrier);
      const changed = await request(baseUrl, `/api/incidents/${id}/resolve`, carrier, "POST", {
        ...payload,
        expectedVersion: incident.version,
        evidenceIds: [other.id],
      });
      assert.equal(changed.status, 200);
      const rows = await IncidentEvent.find({ incidentId: id, idempotencyKey: key }).lean();
      assert.equal(rows.length, 1);
      assert.deepEqual(rows[0]?.evidenceIds, [image.id]);
      assert.equal(await IncidentEvidence.countDocuments({ resolutionKey: key }), 1);
      assert.equal((await IncidentEvidence.findById(other.id).lean())?.incidentId, null);
    });
  });

  await t.test("concurrent resolutions keep evidence on the winning event only", async () => {
    await withServer(async (baseUrl) => {
      const carrier = await login(baseUrl, emails.carrier);
      const shipper = await login(baseUrl, emails.shipper);
      const { id } = await progress(baseUrl, carrier, shipper);
      const winnerImage = await upload(baseUrl, carrier);
      const loserImage = await upload(baseUrl, carrier);
      const incident = await Incident.findById(id).lean();
      assert.ok(incident);
      const send = (key: string, evidenceId: string) =>
        request(baseUrl, `/api/incidents/${id}/resolve`, carrier, "POST", {
          expectedVersion: incident.version,
          idempotencyKey: key,
          resolutionSummary: summary,
          evidenceIds: [evidenceId],
        });
      const winnerKey = nextKey("race-a");
      const loserKey = nextKey("race-b");
      const [left, right] = await Promise.all([send(winnerKey, winnerImage.id), send(loserKey, loserImage.id)]);
      const statuses = [left.status, right.status].sort();
      assert.deepEqual(statuses, [200, 409]);
      const stored = await Incident.findById(id).lean();
      const applied = stored?.appliedKeys ?? [];
      const winningKey = applied.includes(winnerKey) ? winnerKey : loserKey;
      const losingKey = winningKey === winnerKey ? loserKey : winnerKey;
      const winningImage = winningKey === winnerKey ? winnerImage.id : loserImage.id;
      const losingImage = winningImage === winnerImage.id ? loserImage.id : winnerImage.id;
      assert.equal(applied.includes(losingKey), false);
      const event = await IncidentEvent.findOne({ incidentId: id, idempotencyKey: winningKey }).lean();
      assert.deepEqual(event?.evidenceIds, [winningImage]);
      assert.equal(String((await IncidentEvidence.findById(winningImage).lean())?.incidentId), id);
      assert.equal((await IncidentEvidence.findById(losingImage).lean())?.incidentId, null);
      assert.equal(await IncidentEvent.countDocuments({ incidentId: id, evidenceIds: losingImage }), 0);
    });
  });

  await t.test("a later resolution keeps the earlier resolution images, including after close and reopen", async () => {
    await withServer(async (baseUrl) => {
      const carrier = await login(baseUrl, emails.carrier);
      const shipper = await login(baseUrl, emails.shipper);
      const { id, shipmentId } = await progress(baseUrl, carrier, shipper);
      const firstIds = [(await upload(baseUrl, carrier)).id, (await upload(baseUrl, carrier)).id];
      const first = await act(baseUrl, carrier, id, "resolve", { resolutionSummary: "Kết quả lần một: đã vá lốp tạm.", evidenceIds: firstIds });
      assert.equal(first.response.status, 200);
      const objection = await act(baseUrl, shipper, id, "object", { objectionReason: "Lốp vá tạm vẫn xì hơi sau khi xe chạy tiếp." });
      assert.equal(objection.response.status, 200);
      assert.equal(objection.body.incident?.status, "IN_PROGRESS");
      const secondIds = [(await upload(baseUrl, carrier)).id, (await upload(baseUrl, carrier)).id, (await upload(baseUrl, carrier)).id];
      const second = await act(baseUrl, carrier, id, "resolve", { resolutionSummary: "Kết quả lần hai: đã thay lốp mới.", evidenceIds: secondIds });
      assert.equal(second.response.status, 200);
      const closed = await act(baseUrl, carrier, id, "close", { closeReason: "Kết quả xử lý XL-01: đã thay lốp." });
      assert.equal(closed.response.status, 200);
      const requested = await act(baseUrl, shipper, id, "reopen-request", { reason: "Lốp thay tạm bị xì hơi trở lại sau 20 km." });
      assert.equal(requested.response.status, 200);
      const reopened = await act(baseUrl, carrier, id, "reopen-response", { decision: "APPROVE" });
      assert.equal(reopened.response.status, 200);
      const viewed = (await (await request(baseUrl, `/api/incidents/${id}`, shipper)).json()) as IncidentBody;
      const resolutions = resolvedEvents(viewed);
      assert.equal(resolutions.length, 2);
      assert.equal(resolutions[0]?.note, "Kết quả lần một: đã vá lốp tạm.");
      assert.deepEqual(resolutions[0]?.evidence?.map((item) => item.id), firstIds);
      assert.equal(resolutions[1]?.note, "Kết quả lần hai: đã thay lốp mới.");
      assert.deepEqual(resolutions[1]?.evidence?.map((item) => item.id), secondIds);
      assert.equal(resolutions[0]?.actorRole, "CARRIER");
      assert.ok(resolutions[0]?.occurredAt);
      for (const imageId of [...firstIds, ...secondIds]) {
        assert.equal((await fetch(`${baseUrl}/api/incident-evidence/${imageId}`, { headers: { cookie: shipper } })).status, 200);
      }
      const shipment = await Shipment.findById(shipmentId).lean();
      assert.equal(shipment?.status, "MATCHED");
      assert.equal(shipment?.listedPriceVnd, 1500000);
    });
  });

  await t.test("an existing incident without photos stays readable", async () => {
    await withServer(async (baseUrl) => {
      const carrier = await login(baseUrl, emails.carrier);
      const shipper = await login(baseUrl, emails.shipper);
      const shipmentId = await seedShipment();
      const created = await postIncident(baseUrl, shipper, shipmentId);
      const viewed = await request(baseUrl, `/api/incidents/${created.id}`, carrier);
      const body = (await viewed.json()) as IncidentBody;
      assert.equal(viewed.status, 200);
      assert.deepEqual(body.incident?.attachments, []);
      assert.equal(body.events?.some((event) => (event.evidence?.length ?? 0) > 0), false);
    });
  });

  await t.test("unauthorized users cannot retrieve resolution images", async () => {
    await withServer(async (baseUrl) => {
      const carrier = await login(baseUrl, emails.carrier);
      const shipper = await login(baseUrl, emails.shipper);
      const otherCarrier = await login(baseUrl, emails.otherCarrier);
      const admin = await login(baseUrl, emails.admin);
      const { id } = await progress(baseUrl, carrier, shipper);
      const image = await upload(baseUrl, carrier);
      assert.equal((await act(baseUrl, carrier, id, "resolve", { resolutionSummary: summary, evidenceIds: [image.id] })).response.status, 200);
      assert.equal((await fetch(`${baseUrl}/api/incident-evidence/${image.id}`)).status, 401);
      assert.equal((await fetch(`${baseUrl}/api/incident-evidence/${image.id}`, { headers: { cookie: otherCarrier } })).status, 404);
      assert.equal((await fetch(`${baseUrl}/api/incident-evidence/${image.id}`, { headers: { cookie: admin } })).status, 404);
      assert.equal((await fetch(`${baseUrl}/api/incident-evidence/${image.id}`, { headers: { cookie: shipper } })).status, 200);
      assert.equal((await fetch(`${baseUrl}/api/incident-evidence/${image.id}`, { headers: { cookie: carrier } })).status, 200);
    });
  });

  await t.test("an interrupted resolution recovers its evidence, and a lost association is not reported as success", async () => {
    await withServer(async (baseUrl) => {
      const carrier = await login(baseUrl, emails.carrier);
      const shipper = await login(baseUrl, emails.shipper);
      const { id } = await progress(baseUrl, carrier, shipper);
      const image = await upload(baseUrl, carrier);
      const key = nextKey("interrupted");
      await IncidentEvidence.updateOne({ _id: image.id }, { $set: { incidentId: id, resolutionKey: key } });
      await Incident.updateOne(
        { _id: id },
        {
          $set: {
            status: "RESOLVED",
            resolutionSummary: "Đã xử lý sau khi gián đoạn kết nối.",
            resolvedAt: new Date(),
            resolvedBy: ids.carrier,
          },
          $inc: { version: 1 },
          $addToSet: { appliedKeys: key },
          $push: {
            pendingEvents: {
              idempotencyKey: key,
              action: "RESOLVED",
              actorId: ids.carrier,
              actorRole: "CARRIER",
              statusBefore: "IN_PROGRESS",
              statusAfter: "RESOLVED",
              note: "Đã xử lý sau khi gián đoạn kết nối.",
              correlationId: "recovery-correlation",
              evidenceIds: [image.id],
            },
          },
        },
      );
      const viewed = await request(baseUrl, `/api/incidents/${id}`, carrier);
      const recovered = (await viewed.json()) as IncidentBody;
      assert.equal(viewed.status, 200);
      assert.deepEqual(resolvedEvents(recovered).map((event) => event.evidence?.map((item) => item.id)), [[image.id]]);
      const replay = await request(baseUrl, `/api/incidents/${id}/resolve`, carrier, "POST", {
        expectedVersion: recovered.incident?.version,
        idempotencyKey: key,
        resolutionSummary: "Đã xử lý sau khi gián đoạn kết nối.",
        evidenceIds: [image.id],
      });
      assert.equal(replay.status, 200);
      assert.equal(await IncidentEvent.countDocuments({ incidentId: id, idempotencyKey: key }), 1);

      await IncidentEvent.updateOne({ incidentId: id, idempotencyKey: key }, { $set: { evidenceIds: [] } });
      const repaired = (await (await request(baseUrl, `/api/incidents/${id}`, shipper)).json()) as IncidentBody;
      assert.deepEqual(resolvedEvents(repaired).at(-1)?.evidence, [{ id: image.id }]);

      await IncidentEvidence.updateOne({ _id: image.id }, { $set: { incidentId: null, resolutionKey: null } });
      const restored = await request(baseUrl, `/api/incidents/${id}/resolve`, carrier, "POST", {
        expectedVersion: recovered.incident?.version,
        idempotencyKey: key,
        resolutionSummary: "Đã xử lý sau khi gián đoạn kết nối.",
        evidenceIds: [image.id],
      });
      assert.equal(restored.status, 200);
      assert.equal(String((await IncidentEvidence.findById(image.id).lean())?.incidentId), id);
      assert.equal(await IncidentEvent.countDocuments({ incidentId: id, idempotencyKey: key }), 1);

      await IncidentEvidence.deleteOne({ _id: image.id });
      const lost = await request(baseUrl, `/api/incidents/${id}/resolve`, carrier, "POST", {
        expectedVersion: recovered.incident?.version,
        idempotencyKey: key,
        resolutionSummary: "Đã xử lý sau khi gián đoạn kết nối.",
        evidenceIds: [image.id],
      });
      const lostBody = (await lost.json()) as IncidentBody;
      assert.equal(lost.status, 500);
      assert.equal(lostBody.error?.code, "incident_audit_incomplete");
      assert.equal(await IncidentEvent.countDocuments({ incidentId: id, action: "RESOLVED" }), 1);
    });
  });
});
