import assert from "node:assert/strict";
import { createServer } from "node:http";
import { once } from "node:events";
import test, { before, after } from "node:test";
import mongoose from "mongoose";
import { hashPassword } from "../src/auth/password.js";
import { withRequiredCargoImage } from "./support/cargoImage.js";
import { reconcileIncidentArtifacts } from "../src/incidents/service.js";
import { evaluateReminder } from "../src/incidents/lifecycle.js";
import { CommissionLedgerEvent } from "../src/models/commissionLedger.js";
import { Incident } from "../src/models/incident.js";
import { IncidentEvent } from "../src/models/incidentEvent.js";
import { IncidentNotification } from "../src/models/incidentNotification.js";
import { IncidentReminderPolicy } from "../src/models/incidentReminder.js";
import { PlanAuditEvent } from "../src/models/package.js";
import { Shipment } from "../src/models/shipment.js";
import { User } from "../src/models/user.js";
import { Vehicle } from "../src/models/vehicle.js";

process.env.PORT ??= "4000";
process.env.FRONTEND_ORIGIN = "http://127.0.0.1:5173";
process.env.NODE_ENV = "test";
process.env.AUTH_SECRET ??= "test-secret-that-is-at-least-32-characters";
process.env.APP_RUNTIME_MODE = "development";
process.env.PACKAGE_DEMO_SELF_ACTIVATION_ENABLED = "false";
process.env.MONGODB_URI = "mongodb://127.0.0.1:27017/coldi_incident_test";

const databaseName = "coldi_incident_test";
const forbidden = new Set(["coldi", "admin", "local", "config", "coldi_v210_package_qa", "coldi_commission_qa_20261018"]);
const { createApp } = await import("../src/app.js");

const password = "test-password-123";
const shipperEmail = "shipper.incident-test@coldi.local";
const otherShipperEmail = "other.incident-test@coldi.local";
const carrierEmail = "carrier.incident-test@coldi.local";
const otherCarrierEmail = "other-carrier.incident-test@coldi.local";
const driverEmail = "driver.incident-test@coldi.local";
const formerEmail = "former.incident-test@coldi.local";
const adminEmail = "admin.incident-test@coldi.local";
const origin = "http://127.0.0.1:5173";

const ids: Record<string, string> = {};
let sequence = 0;

type Json = Record<string, unknown>;

function nextKey(prefix: string): string {
  sequence += 1;
  return `${prefix}-${sequence}-incident`.slice(0, 80);
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

function request(baseUrl: string, path: string, cookie: string | null, method = "GET", body?: unknown) {
  return fetch(`${baseUrl}${path}`, {
    method,
    headers: {
      origin,
      ...(body === undefined ? {} : { "content-type": "application/json" }),
      ...(cookie ? { cookie } : {}),
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
}

async function publish(baseUrl: string, cookie: string, cargoDescription: string) {
  const response = await request(baseUrl, "/api/shipments", cookie, "POST", await withRequiredCargoImage(baseUrl, cookie, {
    cargoDescription,
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
  }));
  assert.equal(response.status, 201);
  return ((await response.json()) as { shipment: Json }).shipment;
}

async function seedShipment(status: string, extra: Record<string, unknown> = {}) {
  const shipment = await Shipment.create({
    shipperId: ids.shipper,
    cargoDescription: "Hàng lạnh kiểm thử sự cố",
    pickupLocation: "Kho A",
    deliveryLocation: "Kho B",
    temperatureGroup: "FROZEN",
    vehicleRequirement: "Xe đông lạnh",
    listedPriceVnd: 1500000,
    status,
    carrierId: ids.carrier,
    driverId: ids.driver,
    ...extra,
  });
  return shipment._id.toString();
}

function draft(shipmentId: string, incidentType = "DELAY", idempotencyKey = nextKey("create")) {
  return {
    shipmentId,
    incidentType,
    title: "Chậm tại điểm lấy",
    description: "Tài xế chưa tới điểm lấy sau giờ đã hẹn trong lệnh điều xe.",
    idempotencyKey,
  };
}

async function createCase(baseUrl: string, cookie: string, shipmentId: string, incidentType = "DELAY", key = nextKey("create")) {
  const response = await request(baseUrl, "/api/incidents", cookie, "POST", draft(shipmentId, incidentType, key));
  const body = (await response.json()) as { incident: Json; error?: Json };
  return { response, body };
}

before(async () => {
  await mongoose.connect(process.env.MONGODB_URI ?? "");
  if (mongoose.connection.name !== databaseName || forbidden.has(mongoose.connection.name)) {
    throw new Error(`Refusing to use database ${mongoose.connection.name}.`);
  }
  await mongoose.connection.dropDatabase();
  const passwordHash = await hashPassword(password);
  const shipper = await User.create({ email: shipperEmail, passwordHash, role: "SHIPPER" });
  const carrier = await User.create({ email: carrierEmail, passwordHash, role: "CARRIER" });
  await User.create([
    { email: otherShipperEmail, passwordHash, role: "SHIPPER" },
    { email: otherCarrierEmail, passwordHash, role: "CARRIER" },
    { email: driverEmail, passwordHash, role: "DRIVER", carrierId: carrier._id, displayName: "Tài xế hiện tại", mustChangePassword: false },
    { email: formerEmail, passwordHash, role: "DRIVER", carrierId: carrier._id, displayName: "Tài xế trước", mustChangePassword: false },
    { email: adminEmail, passwordHash, role: "ADMIN" },
  ]);
  ids.shipper = shipper._id.toString();
  ids.carrier = carrier._id.toString();
  ids.driver = (await User.findOne({ email: driverEmail }))?._id.toString() ?? "";
  ids.former = (await User.findOne({ email: formerEmail }))?._id.toString() ?? "";
  ids.admin = (await User.findOne({ email: adminEmail }))?._id.toString() ?? "";
  assert.ok(ids.driver && ids.former && ids.admin);
});

after(async () => {
  if (mongoose.connection.name === databaseName && !forbidden.has(mongoose.connection.name)) await mongoose.connection.dropDatabase();
  await mongoose.disconnect();
});

test("incident reporting http", { concurrency: false }, async (t) => {
  await t.test("a shipper opens an incident without changing the shipment", async () => {
    await withServer(async (baseUrl) => {
      const shipmentId = await seedShipment("PUBLISHED", { carrierId: undefined, driverId: undefined });
      const beforeShipment = await Shipment.findById(shipmentId);
      const cookie = await login(baseUrl, shipperEmail);
      const created = await createCase(baseUrl, cookie, shipmentId, "TEMPERATURE_ISSUE");
      assert.equal(created.response.status, 201);
      assert.equal(created.body.incident?.status, "OPEN");
      assert.equal(created.body.incident?.version, 1);
      assert.deepEqual(created.body.incident?.attachments, []);
      const afterShipment = await Shipment.findById(shipmentId);
      assert.equal(afterShipment?.status, "PUBLISHED");
      assert.equal(afterShipment?.listedPriceVnd, beforeShipment?.listedPriceVnd);
      assert.equal(afterShipment?.updatedAt?.toISOString(), beforeShipment?.updatedAt?.toISOString());
      assert.notEqual(afterShipment?.status, "INCIDENT");
    });
  });

  await t.test("all six categories can be reported and invalid input is field-specific", async () => {
    await withServer(async (baseUrl) => {
      const shipmentId = await seedShipment("MATCHED");
      const cookie = await login(baseUrl, shipperEmail);
      for (const incidentType of ["TEMPERATURE_ISSUE", "VEHICLE_ISSUE", "DELAY", "CARGO_ISSUE", "PICKUP_DELIVERY_ISSUE", "OTHER"]) {
        const created = await createCase(baseUrl, cookie, shipmentId, incidentType);
        assert.equal(created.response.status, 201, incidentType);
      }
      const missing = await request(baseUrl, "/api/incidents", cookie, "POST", { shipmentId, incidentType: "DELAY", idempotencyKey: nextKey("bad") });
      const missingBody = (await missing.json()) as { error: { fields: Record<string, string> } };
      assert.equal(missing.status, 400);
      assert.equal(typeof missingBody.error.fields.title, "string");
      assert.equal(typeof missingBody.error.fields.description, "string");
      const invalid = await request(baseUrl, "/api/incidents", cookie, "POST", { ...draft(shipmentId), incidentType: "SPOILAGE" });
      const invalidBody = (await invalid.json()) as { error: { fields: Record<string, string> } };
      assert.equal(invalid.status, 400);
      assert.equal(typeof invalidBody.error.fields.incidentType, "string");
    });
  });

  await t.test("carrier handler moves the case and the reporter can object without erasing the resolution", async () => {
    await withServer(async (baseUrl) => {
      const shipmentId = await seedShipment("IN_TRANSIT");
      const shipperCookie = await login(baseUrl, shipperEmail);
      const carrierCookie = await login(baseUrl, carrierEmail);
      const created = await createCase(baseUrl, shipperCookie, shipmentId);
      const id = String(created.body.incident?.id);
      const acknowledged = await request(baseUrl, `/api/incidents/${id}/acknowledge`, carrierCookie, "POST", { expectedVersion: 1, idempotencyKey: nextKey("ack") });
      const acknowledgedBody = (await acknowledged.json()) as { incident: Json };
      assert.equal(acknowledged.status, 200);
      assert.equal(acknowledgedBody.incident.status, "ACKNOWLEDGED");
      const started = await request(baseUrl, `/api/incidents/${id}/start`, carrierCookie, "POST", {
        expectedVersion: acknowledgedBody.incident.version,
        idempotencyKey: nextKey("start"),
        note: "Đang kiểm tra nhiệt độ khoang.",
      });
      const startedBody = (await started.json()) as { incident: Json };
      assert.equal(started.status, 200);
      assert.equal(startedBody.incident.status, "IN_PROGRESS");
      const resolved = await request(baseUrl, `/api/incidents/${id}/resolve`, carrierCookie, "POST", {
        expectedVersion: startedBody.incident.version,
        idempotencyKey: nextKey("resolve"),
        resolutionSummary: "Đã bổ sung đá gel và nhiệt độ đã về ngưỡng.",
      });
      const resolvedBody = (await resolved.json()) as { incident: Json };
      assert.equal(resolved.status, 200);
      assert.equal(resolvedBody.incident.status, "RESOLVED");
      const early = await request(baseUrl, `/api/incidents/${id}/resolve`, carrierCookie, "POST", {
        expectedVersion: 1,
        idempotencyKey: nextKey("early"),
        resolutionSummary: "Kết quả này không được ghi vì sai trạng thái.",
      });
      assert.equal(early.status, 409);
      const objected = await request(baseUrl, `/api/incidents/${id}/object`, shipperCookie, "POST", {
        expectedVersion: resolvedBody.incident.version,
        idempotencyKey: nextKey("object"),
        objectionReason: "Nhiệt độ tại điểm giao vẫn cao hơn yêu cầu.",
      });
      const objectedBody = (await objected.json()) as { incident: Json };
      assert.equal(objected.status, 200);
      assert.equal(objectedBody.incident.status, "IN_PROGRESS");
      assert.equal(objectedBody.incident.resolutionSummary, "Đã bổ sung đá gel và nhiệt độ đã về ngưỡng.");
      const carrierObject = await request(baseUrl, `/api/incidents/${id}/object`, carrierCookie, "POST", {
        expectedVersion: objectedBody.incident.version,
        idempotencyKey: nextKey("carrier-object"),
        objectionReason: "Nhà xe không được tự phản đối kết quả của mình.",
      });
      assert.equal(carrierObject.status, 409);
      const detail = await request(baseUrl, `/api/incidents/${id}`, shipperCookie);
      const detailBody = (await detail.json()) as { events: { action: string; note: string | null }[] };
      assert.equal(detailBody.events.some((event) => event.action === "RESOLVED" && event.note === "Đã bổ sung đá gel và nhiệt độ đã về ngưỡng."), true);
      const shipment = await Shipment.findById(shipmentId);
      assert.equal(shipment?.status, "IN_TRANSIT");
    });
  });

  await t.test("close, escalation, and priority stay denied", async () => {
    await withServer(async (baseUrl) => {
      const shipmentId = await seedShipment("MATCHED");
      const shipperCookie = await login(baseUrl, shipperEmail);
      const carrierCookie = await login(baseUrl, carrierEmail);
      const created = await createCase(baseUrl, shipperCookie, shipmentId);
      const id = String(created.body.incident?.id);
      for (const [path, code] of [
        ["close", "incident_close_denied"],
        ["escalate", "incident_escalation_denied"],
        ["priority", "incident_priority_denied"],
      ] as const) {
        const denied = await request(baseUrl, `/api/incidents/${id}/${path}`, carrierCookie, "POST", { expectedVersion: 1, idempotencyKey: nextKey(path) });
        const body = (await denied.json()) as { error: { code: string } };
        assert.equal(denied.status, 403);
        assert.equal(body.error.code, code);
      }
      const stored = await Incident.findById(id);
      assert.equal(stored?.status, "OPEN");
      assert.equal(stored?.escalationStatus, "NONE");
      assert.equal(stored?.priority, null);
    });
  });

  await t.test("ownership is enforced for shipper, carrier, driver, former driver, and admin", async () => {
    await withServer(async (baseUrl) => {
      const shipmentId = await seedShipment("IN_TRANSIT", { driverId: ids.former });
      const shipperCookie = await login(baseUrl, shipperEmail);
      const otherShipper = await login(baseUrl, otherShipperEmail);
      const carrierCookie = await login(baseUrl, carrierEmail);
      const otherCarrier = await login(baseUrl, otherCarrierEmail);
      const formerCookie = await login(baseUrl, formerEmail);
      const driverCookie = await login(baseUrl, driverEmail);
      const adminCookie = await login(baseUrl, adminEmail);
      const own = await createCase(baseUrl, formerCookie, shipmentId, "VEHICLE_ISSUE");
      assert.equal(own.response.status, 201);
      const shared = await createCase(baseUrl, shipperCookie, shipmentId, "CARGO_ISSUE");
      assert.equal(shared.response.status, 201);
      const ownId = String(own.body.incident?.id);
      const sharedId = String(shared.body.incident?.id);

      assert.equal((await request(baseUrl, `/api/incidents/${sharedId}`, otherShipper)).status, 404);
      assert.equal((await request(baseUrl, `/api/incidents/${sharedId}`, otherCarrier)).status, 404);
      assert.equal((await request(baseUrl, `/api/incidents/${sharedId}`, driverCookie)).status, 404);
      assert.equal((await request(baseUrl, `/api/incidents/${sharedId}`, adminCookie)).status, 404);
      assert.equal((await request(baseUrl, `/api/incidents/${ownId}`, formerCookie)).status, 200);
      assert.equal((await request(baseUrl, `/api/incidents/${sharedId}`, formerCookie)).status, 200);
      assert.equal((await request(baseUrl, `/api/incidents/${ownId}/acknowledge`, formerCookie, "POST", { expectedVersion: 1, idempotencyKey: nextKey("former") })).status, 403);

      await Shipment.updateOne({ _id: shipmentId }, { $set: { driverId: ids.driver } });
      assert.equal((await request(baseUrl, `/api/incidents/${sharedId}`, formerCookie)).status, 404);
      assert.equal((await request(baseUrl, `/api/incidents/${ownId}`, formerCookie)).status, 200);
      assert.equal((await request(baseUrl, `/api/incidents/${sharedId}`, driverCookie)).status, 200);
      assert.equal((await createCase(baseUrl, formerCookie, shipmentId, "OTHER")).response.status, 404);
      assert.equal((await createCase(baseUrl, driverCookie, shipmentId, "PICKUP_DELIVERY_ISSUE")).response.status, 201);
      assert.equal((await createCase(baseUrl, otherCarrier, shipmentId)).response.status, 404);
      assert.equal((await createCase(baseUrl, carrierCookie, shipmentId)).response.status, 201);

      const unclaimed = await seedShipment("PUBLISHED", { carrierId: undefined, driverId: undefined });
      assert.equal((await createCase(baseUrl, carrierCookie, unclaimed)).response.status, 404);

      const adminList = await request(baseUrl, "/api/incidents", adminCookie);
      const adminBody = (await adminList.json()) as { incidents: Json[] };
      assert.equal(adminBody.incidents.length, 0);
      await Incident.updateOne({ _id: sharedId }, { $set: { handlerId: ids.admin } });
      assert.equal((await request(baseUrl, `/api/incidents/${sharedId}`, adminCookie)).status, 200);
      assert.equal((await request(baseUrl, `/api/incidents/${sharedId}/comments`, adminCookie, "POST", { expectedVersion: 1, idempotencyKey: nextKey("admin"), body: "Ghi chú nội bộ không được mở." })).status, 403);
    });
  });

  await t.test("forged identity, evidence, guests, and other tenants are rejected", async () => {
    await withServer(async (baseUrl) => {
      const shipmentId = await seedShipment("MATCHED");
      const cookie = await login(baseUrl, shipperEmail);
      const beforeCount = await Incident.countDocuments({ shipmentId });
      const forged = await request(baseUrl, "/api/incidents", cookie, "POST", { ...draft(shipmentId), reporterRole: "ADMIN" });
      const forgedBody = (await forged.json()) as { error: { code: string } };
      assert.equal(forged.status, 400);
      assert.equal(forgedBody.error.code, "forged_actor");
      const images = await request(baseUrl, "/api/incidents", cookie, "POST", { ...draft(shipmentId), images: ["proof.jpg"] });
      const imageBody = (await images.json()) as { error: { code: string } };
      assert.equal(images.status, 400);
      assert.equal(imageBody.error.code, "incident_evidence_blocked");
      assert.equal(await Incident.countDocuments({ shipmentId }), beforeCount);
      assert.equal((await request(baseUrl, "/api/incidents", null)).status, 401);
      const created = await createCase(baseUrl, cookie, shipmentId);
      const id = String(created.body.incident?.id);
      const outsider = await login(baseUrl, otherShipperEmail);
      assert.equal((await request(baseUrl, `/api/incidents/${id}`, outsider)).status, 404);
      const script = `${draft(shipmentId).description} <script>alert(1)</script>`;
      const xss = await request(baseUrl, "/api/incidents", cookie, "POST", { ...draft(shipmentId), description: script });
      const xssBody = (await xss.json()) as { incident: { description: string } };
      assert.equal(xss.status, 201);
      assert.equal(xssBody.incident.description.includes("<script>alert(1)</script>"), true);
      assert.equal(xss.headers.get("content-type")?.includes("application/json"), true);
    });
  });

  await t.test("notifications stay with the authorized recipient and links recheck access", async () => {
    await withServer(async (baseUrl) => {
      const shipmentId = await seedShipment("MATCHED");
      const shipperCookie = await login(baseUrl, shipperEmail);
      const carrierCookie = await login(baseUrl, carrierEmail);
      const otherCarrier = await login(baseUrl, otherCarrierEmail);
      const created = await createCase(baseUrl, shipperCookie, shipmentId);
      const id = String(created.body.incident?.id);
      const carrierNotes = await request(baseUrl, "/api/incidents/notifications", carrierCookie);
      const carrierBody = (await carrierNotes.json()) as { notifications: { id: string; incidentId: string; label: string; read: boolean }[] };
      const mine = carrierBody.notifications.filter((item) => item.incidentId === id);
      assert.equal(mine.length, 1);
      assert.equal(mine[0]?.label.includes("0908") ?? false, false);
      const again = await request(baseUrl, `/api/incidents/${id}`, shipperCookie);
      assert.equal(again.status, 200);
      const after = (await (await request(baseUrl, "/api/incidents/notifications", carrierCookie)).json()) as { notifications: { incidentId: string }[] };
      assert.equal(after.notifications.filter((item) => item.incidentId === id).length, 1);
      const otherNotes = (await (await request(baseUrl, "/api/incidents/notifications", otherCarrier)).json()) as { notifications: { incidentId: string }[] };
      assert.equal(otherNotes.notifications.some((item) => item.incidentId === id), false);
      assert.equal((await request(baseUrl, `/api/incidents/notifications/${mine[0]?.id}/read`, otherCarrier, "POST", {})).status, 404);
      const marked = await request(baseUrl, `/api/incidents/notifications/${mine[0]?.id}/read`, carrierCookie, "POST", {});
      const markedBody = (await marked.json()) as { notification: { read: boolean } };
      assert.equal(marked.status, 200);
      assert.equal(markedBody.notification.read, true);
      assert.equal((await request(baseUrl, `/api/incidents/${id}`, otherCarrier)).status, 404);

      await IncidentEvent.create({
        incidentId: id,
        action: "COMMENT",
        actorId: ids.admin,
        actorRole: "ADMIN",
        occurredAt: new Date(),
        statusBefore: "OPEN",
        statusAfter: "OPEN",
        escalationBefore: "NONE",
        escalationAfter: "NONE",
        note: "Ghi chú nội bộ không được hiện",
        idempotencyKey: nextKey("internal"),
        correlationId: "internal-correlation",
        visibility: "INTERNAL",
      });
      const events = (await (await request(baseUrl, `/api/incidents/${id}/events`, shipperCookie)).json()) as { events: { note: string | null }[] };
      assert.equal(events.events.some((event) => event.note === "Ghi chú nội bộ không được hiện"), false);
    });
  });

  await t.test("duplicate creates, retries, races, and audit recovery stay single-purpose", async () => {
    await withServer(async (baseUrl) => {
      const shipmentId = await seedShipment("MATCHED");
      const shipperCookie = await login(baseUrl, shipperEmail);
      const carrierCookie = await login(baseUrl, carrierEmail);
      const idempotencyKey = nextKey("same");
      const first = await createCase(baseUrl, shipperCookie, shipmentId, "DELAY", idempotencyKey);
      const second = await createCase(baseUrl, shipperCookie, shipmentId, "DELAY", idempotencyKey);
      assert.equal(first.response.status, 201);
      assert.equal(second.response.status, 200);
      assert.equal(second.body.incident?.id, first.body.incident?.id);
      const createdId = String(first.body.incident?.id);
      assert.equal(await IncidentEvent.countDocuments({ incidentId: createdId, action: "CREATED" }), 1);

      const raceShipment = await seedShipment("IN_TRANSIT");
      const race = await createCase(baseUrl, shipperCookie, raceShipment);
      const raceId = String(race.body.incident?.id);
      const keyA = nextKey("race-a");
      const keyB = nextKey("race-b");
      const [left, right] = await Promise.all([
        request(baseUrl, `/api/incidents/${raceId}/acknowledge`, carrierCookie, "POST", { expectedVersion: 1, idempotencyKey: keyA }),
        request(baseUrl, `/api/incidents/${raceId}/acknowledge`, carrierCookie, "POST", { expectedVersion: 1, idempotencyKey: keyB }),
      ]);
      assert.deepEqual([left.status, right.status].sort(), [200, 409]);
      assert.equal(await IncidentEvent.countDocuments({ incidentId: raceId, action: "ACKNOWLEDGED" }), 1);

      const retryIdShipment = await seedShipment("MATCHED");
      const retryCase = await createCase(baseUrl, shipperCookie, retryIdShipment);
      const retryId = String(retryCase.body.incident?.id);
      const retryKey = nextKey("retry");
      const onceAck = await request(baseUrl, `/api/incidents/${retryId}/acknowledge`, carrierCookie, "POST", { expectedVersion: 1, idempotencyKey: retryKey });
      const twiceAck = await request(baseUrl, `/api/incidents/${retryId}/acknowledge`, carrierCookie, "POST", { expectedVersion: 1, idempotencyKey: retryKey });
      assert.equal(onceAck.status, 200);
      assert.equal(twiceAck.status, 200);
      assert.equal(await IncidentEvent.countDocuments({ incidentId: retryId, action: "ACKNOWLEDGED" }), 1);
      const retried = await Incident.findById(retryId);
      assert.equal(retried?.version, 2);

      const lostShipment = await seedShipment("MATCHED");
      const lostCase = await createCase(baseUrl, shipperCookie, lostShipment);
      const lostId = String(lostCase.body.incident?.id);
      const lostKey = nextKey("lost");
      await Incident.updateOne({ _id: lostId }, { $set: { status: "ACKNOWLEDGED", version: 2 }, $addToSet: { appliedKeys: lostKey } });
      const recovered = await request(baseUrl, `/api/incidents/${lostId}/acknowledge`, carrierCookie, "POST", { expectedVersion: 1, idempotencyKey: lostKey });
      assert.equal(recovered.status, 200);
      const lostStored = await Incident.findById(lostId);
      assert.equal(lostStored?.version, 2);
      assert.equal(await IncidentEvent.countDocuments({ incidentId: lostId, action: "ACKNOWLEDGED" }), 1);

      await IncidentEvent.deleteMany({ incidentId: lostId, action: "CREATED" });
      assert.equal((await request(baseUrl, `/api/incidents/${lostId}`, shipperCookie)).status, 200);
      assert.equal(await IncidentEvent.countDocuments({ incidentId: lostId, action: "CREATED" }), 1);
      await IncidentEvent.deleteMany({ incidentId: lostId, action: "CREATED" });
      await reconcileIncidentArtifacts();
      assert.equal(await IncidentEvent.countDocuments({ incidentId: lostId, action: "CREATED" }), 1);

      const progressShipment = await seedShipment("IN_TRANSIT");
      const progress = await createCase(baseUrl, shipperCookie, progressShipment);
      const progressId = String(progress.body.incident?.id);
      await request(baseUrl, `/api/incidents/${progressId}/acknowledge`, carrierCookie, "POST", { expectedVersion: 1, idempotencyKey: nextKey("pre") });
      const started = await request(baseUrl, `/api/incidents/${progressId}/start`, carrierCookie, "POST", {
        expectedVersion: 2,
        idempotencyKey: nextKey("pre-start"),
        note: "Bắt đầu kiểm tra.",
      });
      assert.equal(started.status, 200);
      const resolveKeyA = nextKey("resolve-a");
      const resolveKeyB = nextKey("resolve-b");
      const [resolveLeft, resolveRight] = await Promise.all([
        request(baseUrl, `/api/incidents/${progressId}/resolve`, carrierCookie, "POST", { expectedVersion: 3, idempotencyKey: resolveKeyA, resolutionSummary: "Kết quả xử lý thứ nhất đã đủ dài." }),
        request(baseUrl, `/api/incidents/${progressId}/resolve`, carrierCookie, "POST", { expectedVersion: 3, idempotencyKey: resolveKeyB, resolutionSummary: "Kết quả xử lý thứ hai đã đủ dài." }),
      ]);
      assert.deepEqual([resolveLeft.status, resolveRight.status].sort(), [200, 409]);
      assert.equal(await IncidentEvent.countDocuments({ incidentId: progressId, action: "RESOLVED" }), 1);

      const objectShipment = await seedShipment("IN_TRANSIT");
      const objectCase = await createCase(baseUrl, shipperCookie, objectShipment);
      const objectId = String(objectCase.body.incident?.id);
      await request(baseUrl, `/api/incidents/${objectId}/acknowledge`, carrierCookie, "POST", { expectedVersion: 1, idempotencyKey: nextKey("obj-ack") });
      await request(baseUrl, `/api/incidents/${objectId}/start`, carrierCookie, "POST", { expectedVersion: 2, idempotencyKey: nextKey("obj-start"), note: "Đang xử lý." });
      const [resolved, objected] = await Promise.all([
        request(baseUrl, `/api/incidents/${objectId}/resolve`, carrierCookie, "POST", { expectedVersion: 3, idempotencyKey: nextKey("obj-resolve"), resolutionSummary: "Đã xử lý xong phần nhiệt độ khoang." }),
        request(baseUrl, `/api/incidents/${objectId}/object`, shipperCookie, "POST", { expectedVersion: 3, idempotencyKey: nextKey("obj-race"), objectionReason: "Phản đối khi kết quả chưa được ghi." }),
      ]);
      assert.equal(resolved.status, 200);
      assert.equal(objected.status, 409);
      const resolvedBody = (await resolved.json()) as { incident: { version: number } };
      const follow = await request(baseUrl, `/api/incidents/${objectId}/object`, shipperCookie, "POST", {
        expectedVersion: resolvedBody.incident.version,
        idempotencyKey: nextKey("obj-follow"),
        objectionReason: "Kết quả chưa xử lý đúng nhiệt độ giao.",
      });
      const followBody = (await follow.json()) as { incident: { status: string; resolutionSummary: string } };
      assert.equal(follow.status, 200);
      assert.equal(followBody.incident.status, "IN_PROGRESS");
      assert.equal(followBody.incident.resolutionSummary, "Đã xử lý xong phần nhiệt độ khoang.");

      const commentKey = nextKey("comment");
      const commentShipment = await seedShipment("MATCHED");
      const commentCase = await createCase(baseUrl, shipperCookie, commentShipment);
      const commentId = String(commentCase.body.incident?.id);
      const commentBody = { expectedVersion: 1, idempotencyKey: commentKey, body: "Cập nhật đầu tiên không được nhân đôi." };
      assert.equal((await request(baseUrl, `/api/incidents/${commentId}/comments`, shipperCookie, "POST", commentBody)).status, 200);
      assert.equal((await request(baseUrl, `/api/incidents/${commentId}/comments`, shipperCookie, "POST", commentBody)).status, 200);
      assert.equal(await IncidentEvent.countDocuments({ incidentId: commentId, action: "COMMENT" }), 1);
    });
  });

  await t.test("incident pages stay stable and reminders do not send themselves", async () => {
    await withServer(async (baseUrl) => {
      const shipmentId = await seedShipment("MATCHED");
      const cookie = await login(baseUrl, shipperEmail);
      const createdIds: string[] = [];
      for (let index = 0; index < 3; index += 1) {
        const created = await createCase(baseUrl, cookie, shipmentId, "OTHER");
        createdIds.push(String(created.body.incident?.id));
      }
      const first = await request(baseUrl, `/api/incidents?shipmentId=${shipmentId}&limit=2`, cookie);
      const firstBody = (await first.json()) as { incidents: { id: string }[]; nextCursor: string | null };
      const second = await request(baseUrl, `/api/incidents?shipmentId=${shipmentId}&limit=2&cursor=${encodeURIComponent(firstBody.nextCursor ?? "")}`, cookie);
      const secondBody = (await second.json()) as { incidents: { id: string }[] };
      const repeated = (await (await request(baseUrl, `/api/incidents?shipmentId=${shipmentId}&limit=2`, cookie)).json()) as { incidents: { id: string }[] };
      const seen = [...firstBody.incidents, ...secondBody.incidents].map((item) => item.id);
      assert.equal(firstBody.incidents.length, 2);
      assert.equal(secondBody.incidents.length, 1);
      assert.equal(new Set(seen).size, 3);
      assert.deepEqual(createdIds.filter((id) => !seen.includes(id)), []);
      assert.deepEqual(repeated.incidents.map((item) => item.id), firstBody.incidents.map((item) => item.id));

      const policy = await IncidentReminderPolicy.create({ kind: "ACK_PENDING" });
      assert.equal(policy.enabled, false);
      const open = await Incident.findById(createdIds[0]);
      assert.ok(open);
      const beforeNotes = await IncidentNotification.countDocuments();
      assert.equal(
        evaluateReminder(
          { kind: "ACK_PENDING", enabled: policy.enabled, intervalMinutes: policy.intervalMinutes ?? null },
          { status: open.status, escalationStatus: open.escalationStatus, reportedAt: open.reportedAt, updatedAt: open.updatedAt, resolvedAt: open.resolvedAt ?? null },
          new Date(open.reportedAt.getTime() + 60 * 60 * 1000),
        ),
        null,
      );
      assert.equal(await IncidentNotification.countDocuments(), beforeNotes);
    });
  });

  await t.test("logistics still proceed and an open incident does not seize the shipment", async () => {
    await withServer(async (baseUrl) => {
      const shipperCookie = await login(baseUrl, shipperEmail);
      const carrierCookie = await login(baseUrl, carrierEmail);
      const driverCookie = await login(baseUrl, driverEmail);
      const published = await publish(baseUrl, shipperCookie, "Cá hồi kiểm thử sự cố");
      const shipmentId = String(published.id);
      const claimed = await request(baseUrl, `/api/carrier/shipments/${shipmentId}/claim`, carrierCookie, "POST", {});
      assert.equal(claimed.status, 200);
      const vehicleResponse = await request(baseUrl, "/api/carrier/fleet/vehicles", carrierCookie, "POST", {
        label: "Xe kiểm thử sự cố",
        plate: "51A-12345",
        vehicleKind: "REEFER_TRUCK",
        temperatureGroup: "FROZEN",
        capacityTon: 5,
      });
      assert.equal(vehicleResponse.status, 201);
      const vehicleId = String(((await vehicleResponse.json()) as { vehicle: Json }).vehicle.id);
      const assigned = await request(baseUrl, `/api/carrier/shipments/${shipmentId}/assign`, carrierCookie, "POST", { vehicleId, driverId: ids.driver });
      assert.equal(assigned.status, 200);
      const vehiclesBefore = await Vehicle.countDocuments();
      const auditsBefore = await PlanAuditEvent.countDocuments();
      const created = await createCase(baseUrl, shipperCookie, shipmentId, "DELAY");
      assert.equal(created.response.status, 201);
      const incidentId = String(created.body.incident?.id);
      const during = await Shipment.findById(shipmentId);
      assert.equal(during?.status, "MATCHED");
      assert.equal(during?.listedPriceVnd, 6200000);
      assert.equal(during?.driverId?.toString(), ids.driver);
      assert.equal(during?.vehicleId?.toString(), vehicleId);
      assert.equal(await Vehicle.countDocuments(), vehiclesBefore);
      assert.equal(await PlanAuditEvent.countDocuments(), auditsBefore);
      assert.equal(during?.commission, undefined);
      assert.equal(await CommissionLedgerEvent.countDocuments({ shipmentId }), 0);

      const second = await publish(baseUrl, shipperCookie, "Hàng thứ hai cùng xe");
      assert.equal((await request(baseUrl, `/api/carrier/shipments/${String(second.id)}/claim`, carrierCookie, "POST", {})).status, 200);
      const busy = await request(baseUrl, `/api/carrier/shipments/${String(second.id)}/assign`, carrierCookie, "POST", { vehicleId, driverId: ids.former });
      assert.equal(busy.status, 409);

      assert.equal((await request(baseUrl, `/api/driver/shipments/${shipmentId}/pickup`, driverCookie, "POST", {})).status, 200);
      const located = await request(baseUrl, `/api/driver/shipments/${shipmentId}/location`, driverCookie, "POST", {
        latitude: 10.776,
        longitude: 106.7,
        observedAt: new Date().toISOString(),
      });
      assert.equal(located.status, 200);
      const moving = await Shipment.findById(shipmentId);
      assert.equal(moving?.status, "IN_TRANSIT");
      assert.equal(moving?.latestLocation?.latitude, 10.776);
      assert.equal((await Incident.findById(incidentId))?.status, "OPEN");
      assert.equal((await request(baseUrl, `/api/driver/shipments/${shipmentId}/delivery`, driverCookie, "POST", {})).status, 200);
      const delivered = await Shipment.findById(shipmentId);
      assert.equal(delivered?.status, "DELIVERY_CONFIRMED");
      assert.equal(delivered?.listedPriceVnd, 6200000);
      assert.equal(delivered?.commission, undefined);
      assert.equal(await CommissionLedgerEvent.countDocuments({ shipmentId }), 0);
      assert.equal((await Incident.findById(incidentId))?.status, "OPEN");
      const late = await createCase(baseUrl, shipperCookie, shipmentId, "OTHER");
      assert.equal(late.response.status, 409);
      assert.equal((late.body.error as { code?: string } | undefined)?.code, "incident_report_window");
    });
  });
});
