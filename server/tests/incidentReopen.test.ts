import assert from "node:assert/strict";
import { createServer } from "node:http";
import { once } from "node:events";
import test, { before, after } from "node:test";
import mongoose from "mongoose";
import { hashPassword } from "../src/auth/password.js";
import { escalateOverdueReopenRequests, reconcileIncidentArtifacts } from "../src/incidents/service.js";
import { reopenCarrierWindowMs } from "../src/incidents/policy.js";
import { CommissionLedgerEvent } from "../src/models/commissionLedger.js";
import { Incident } from "../src/models/incident.js";
import { IncidentEvent } from "../src/models/incidentEvent.js";
import { IncidentNotification } from "../src/models/incidentNotification.js";
import { Shipment } from "../src/models/shipment.js";
import { User } from "../src/models/user.js";

process.env.PORT ??= "4000";
process.env.FRONTEND_ORIGIN = "http://127.0.0.1:5173";
process.env.NODE_ENV = "test";
process.env.AUTH_SECRET ??= "test-secret-that-is-at-least-32-characters";
process.env.APP_RUNTIME_MODE = "development";
process.env.PACKAGE_DEMO_SELF_ACTIVATION_ENABLED = "false";
process.env.MONGODB_URI = "mongodb://127.0.0.1:27017/coldi_incident_reopen_test";

const databaseName = "coldi_incident_reopen_test";
const forbidden = new Set(["coldi", "coldi_demo_local", "admin", "local", "config", "coldi_v210_package_qa", "coldi_commission_qa_20261018"]);
const { createApp } = await import("../src/app.js");

const password = "test-password-123";
const emails = {
  shipper: "shipper.reopen-test@coldi.local",
  otherShipper: "other-shipper.reopen-test@coldi.local",
  carrier: "carrier.reopen-test@coldi.local",
  otherCarrier: "other-carrier.reopen-test@coldi.local",
  driver: "driver.reopen-test@coldi.local",
  admin: "admin.reopen-test@coldi.local",
  otherAdmin: "other-admin.reopen-test@coldi.local",
} as const;
type Who = keyof typeof emails;
const origin = "http://127.0.0.1:5173";
const ids = {} as Record<Who, string>;
let sequence = 0;

type Reopen = { status: string; reason: string | null; carrierDeadlineAt: string | null; escalationCause: string | null; adminAssigned: boolean; adminReason: string | null };
type View = {
  id: string;
  status: string;
  version: number;
  resolutionSummary: string | null;
  objectionReason: string | null;
  closedAt: string | null;
  closeReason: string | null;
  reopen: Reopen;
  capabilities: Record<string, boolean>;
};
type Reply = { status: number; incident: View | undefined; error: { code: string; fields?: Record<string, string> } | undefined };

function nextKey(prefix: string): string {
  sequence += 1;
  return `${prefix}-${sequence}-reopen`.slice(0, 80);
}

async function withServer(run: (call: Caller) => Promise<void>) {
  const server = createServer(createApp());
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  const address = server.address();
  if (address === null || typeof address === "string") throw new Error("Test server did not bind.");
  const baseUrl = `http://127.0.0.1:${address.port}`;
  const cookies = new Map<Who, string>();
  const call: Caller = async (who, method, path, body) => {
    let cookie = cookies.get(who);
    if (!cookie) {
      const response = await fetch(`${baseUrl}/api/auth/login`, {
        method: "POST",
        headers: { "content-type": "application/json", origin },
        body: JSON.stringify({ email: emails[who], password }),
      });
      assert.equal(response.status, 200, who);
      cookie = (response.headers.getSetCookie().find((value) => value.startsWith("coldi_session=")) ?? "").split(";")[0] ?? "";
      cookies.set(who, cookie);
    }
    const response = await fetch(`${baseUrl}${path}`, {
      method,
      headers: { origin, cookie, ...(body === undefined ? {} : { "content-type": "application/json" }) },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
    const json = (await response.json()) as { incident?: View; error?: Reply["error"] };
    return { status: response.status, incident: json.incident, error: json.error };
  };
  try {
    await run(call);
  } finally {
    server.close();
    await once(server, "close");
  }
}

type Caller = (who: Who, method: "GET" | "POST", path: string, body?: Record<string, unknown>) => Promise<Reply>;

async function seedShipment() {
  const shipment = await Shipment.create({
    shipperId: ids.shipper,
    cargoDescription: "Hàng lạnh kiểm thử mở lại",
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

async function current(id: string) {
  const stored = await Incident.findById(id).lean();
  assert.ok(stored);
  return stored;
}

async function act(call: Caller, who: Who, id: string, path: string, body: Record<string, unknown> = {}, key = nextKey(path)) {
  const { version } = await current(id);
  return call(who, "POST", `/api/incidents/${id}/${path}`, { expectedVersion: version, idempotencyKey: key, ...body });
}

async function resolvedCase(call: Caller, incidentType = "VEHICLE_ISSUE") {
  const shipmentId = await seedShipment();
  const created = await call("shipper", "POST", "/api/incidents", {
    shipmentId,
    incidentType,
    title: "Xe bị lủng lốp",
    description: "Xe bị lủng lốp trên quốc lộ, tài xế đang chờ thay lốp dự phòng.",
    idempotencyKey: nextKey("create"),
  });
  assert.equal(created.status, 201);
  const id = String(created.incident?.id);
  assert.equal((await act(call, "carrier", id, "acknowledge")).status, 200);
  assert.equal((await act(call, "carrier", id, "start", { note: "Đang điều xe cứu hộ thay lốp." })).status, 200);
  assert.equal((await act(call, "carrier", id, "resolve", { resolutionSummary: "Đã thay lốp dự phòng, xe tiếp tục hành trình." })).status, 200);
  return { id, shipmentId };
}

async function closedCase(call: Caller) {
  const result = await resolvedCase(call);
  const closed = await act(call, "carrier", result.id, "close", { closeReason: "Kết quả xử lý XL-01: đã thay lốp." });
  assert.equal(closed.status, 200);
  return result;
}

async function actions(id: string): Promise<string[]> {
  const rows = await IncidentEvent.find({ incidentId: id }).sort({ occurredAt: 1, _id: 1 }).lean();
  return rows.map((row) => row.action);
}

const reopenReason = "Lốp thay tạm bị xì hơi trở lại sau 20 km.";

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
    { email: emails.otherShipper, passwordHash, role: "SHIPPER" },
    { email: emails.otherCarrier, passwordHash, role: "CARRIER" },
    { email: emails.driver, passwordHash, role: "DRIVER", carrierId: carrier._id, displayName: "Tài xế", mustChangePassword: false },
    { email: emails.admin, passwordHash, role: "ADMIN" },
    { email: emails.otherAdmin, passwordHash, role: "ADMIN" },
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

test("vehicle incident close and reopen", { concurrency: false }, async (t) => {
  await t.test("only the assigned carrier closes a resolved vehicle issue and history stays", async () => {
    await withServer(async (call) => {
      const { id, shipmentId } = await resolvedCase(call);
      const comment = await act(call, "shipper", id, "comments", { body: "Cảm ơn nhà xe đã xử lý nhanh." });
      assert.equal(comment.status, 200);
      const before = await Shipment.findById(shipmentId).lean();

      for (const who of ["shipper", "driver"] as const) {
        const denied = await act(call, who, id, "close", { closeReason: "Đóng thử bởi người không có quyền." });
        assert.equal(denied.status, 403, who);
        assert.equal(denied.error?.code, "incident_forbidden");
      }
      for (const who of ["otherCarrier", "otherShipper", "admin"] as const) {
        assert.equal((await act(call, who, id, "close", { closeReason: "Đóng thử bởi tài khoản ngoài chuyến." })).status, 404, who);
      }
      const missing = await act(call, "carrier", id, "close", {});
      assert.equal(missing.status, 400);
      assert.equal(typeof missing.error?.fields?.closeReason, "string");

      const key = nextKey("close");
      const closed = await act(call, "carrier", id, "close", { closeReason: "Kết quả xử lý XL-01: đã thay lốp." }, key);
      assert.equal(closed.status, 200);
      assert.equal(closed.incident?.status, "CLOSED");
      assert.equal(closed.incident?.closeReason, "Kết quả xử lý XL-01: đã thay lốp.");
      assert.equal(closed.incident?.resolutionSummary, "Đã thay lốp dự phòng, xe tiếp tục hành trình.");
      assert.equal(closed.incident?.reopen.status, "NONE");
      const replay = await call("carrier", "POST", `/api/incidents/${id}/close`, { expectedVersion: closed.incident!.version - 1, idempotencyKey: key, closeReason: "Kết quả xử lý XL-01: đã thay lốp." });
      assert.equal(replay.status, 200);
      assert.equal(replay.incident?.version, closed.incident?.version);
      assert.equal((await act(call, "carrier", id, "close", { closeReason: "Đóng lần hai cho cùng sự cố." })).status, 409);

      const events = await IncidentEvent.find({ incidentId: id, action: "CLOSED" }).lean();
      assert.equal(events.length, 1);
      assert.equal(events[0]?.actorId?.toString(), ids.carrier);
      assert.equal(events[0]?.actorRole, "CARRIER");
      assert.equal(events[0]?.note, "Kết quả xử lý XL-01: đã thay lốp.");
      assert.ok(events[0]?.occurredAt instanceof Date);
      assert.deepEqual(await actions(id), ["CREATED", "ACKNOWLEDGED", "INVESTIGATION_STARTED", "RESOLVED", "COMMENT", "CLOSED"]);

      const after = await Shipment.findById(shipmentId).lean();
      assert.equal(after?.status, before?.status);
      assert.equal(after?.listedPriceVnd, before?.listedPriceVnd);
      assert.equal(after?.updatedAt?.toISOString(), before?.updatedAt?.toISOString());
      assert.equal(await CommissionLedgerEvent.countDocuments({ shipmentId }), 0);
      const notices = await IncidentNotification.find({ incidentId: id, eventType: "CLOSED" }).lean();
      assert.deepEqual(notices.map((row) => row.recipientId.toString()).sort(), [ids.shipper, ids.driver].sort());
    });
  });

  await t.test("closing from an active state and other categories stays denied", async () => {
    await withServer(async (call) => {
      const shipmentId = await seedShipment();
      const created = await call("shipper", "POST", "/api/incidents", {
        shipmentId,
        incidentType: "VEHICLE_ISSUE",
        title: "Xe hỏng máy lạnh",
        description: "Máy lạnh ngừng chạy, tài xế đang kiểm tra.",
        idempotencyKey: nextKey("create"),
      });
      const id = String(created.incident?.id);
      assert.equal((await act(call, "carrier", id, "close", { closeReason: "Đóng khi sự cố còn mở." })).error?.code, "invalid_transition");
      await act(call, "carrier", id, "acknowledge");
      await act(call, "carrier", id, "start", { note: "Đang kiểm tra máy lạnh." });
      const inProgress = await act(call, "carrier", id, "close", { closeReason: "Đóng khi đang xử lý." });
      assert.equal(inProgress.status, 409);
      assert.equal((await current(id)).status, "IN_PROGRESS");

      for (const type of ["DELAY", "TEMPERATURE_ISSUE", "CARGO_ISSUE", "PICKUP_DELIVERY_ISSUE", "OTHER"]) {
        const other = await resolvedCase(call, type);
        const close = await act(call, "carrier", other.id, "close", { closeReason: "Đóng loại sự cố khác." });
        assert.equal(close.status, 403, type);
        assert.equal(close.error?.code, "incident_close_denied");
        assert.equal((await current(other.id)).status, "RESOLVED");
        const object = await act(call, "shipper", other.id, "object", { objectionReason: "Kết quả chưa đúng với thực tế." });
        assert.equal(object.status, 200, type);
      }
    });
  });

  await t.test("a reopen request needs the owning shipper and a reason and keeps the incident closed", async () => {
    await withServer(async (call) => {
      const { id } = await closedCase(call);
      for (const who of ["carrier", "driver"] as const) {
        const denied = await act(call, who, id, "reopen-request", { reason: reopenReason });
        assert.equal(denied.status, 403, who);
      }
      assert.equal((await act(call, "otherShipper", id, "reopen-request", { reason: reopenReason })).status, 404);
      const missing = await act(call, "shipper", id, "reopen-request", { reason: "ngắn" });
      assert.equal(missing.status, 400);
      assert.equal(typeof missing.error?.fields?.reason, "string");

      const startedAt = Date.now();
      const key = nextKey("reopen");
      const requested = await act(call, "shipper", id, "reopen-request", { reason: reopenReason }, key);
      assert.equal(requested.status, 200);
      assert.equal(requested.incident?.status, "CLOSED");
      assert.equal(requested.incident?.reopen.status, "PENDING_CARRIER");
      assert.equal(requested.incident?.reopen.reason, reopenReason);
      const deadline = Date.parse(String(requested.incident?.reopen.carrierDeadlineAt));
      assert.ok(deadline >= startedAt + reopenCarrierWindowMs && deadline <= Date.now() + reopenCarrierWindowMs);
      assert.equal(requested.incident?.capabilities.respondReopen, false);

      const replay = await call("shipper", "POST", `/api/incidents/${id}/reopen-request`, { expectedVersion: 1, idempotencyKey: key, reason: reopenReason });
      assert.equal(replay.status, 200);
      assert.equal((await act(call, "shipper", id, "reopen-request", { reason: reopenReason })).status, 409);
      assert.equal((await IncidentEvent.countDocuments({ incidentId: id, action: "REOPEN_REQUESTED" })), 1);
      assert.equal((await act(call, "shipper", id, "comments", { body: "Bình luận khi đã đóng." })).status, 409);

      const carrierView = await call("carrier", "GET", `/api/incidents/${id}`);
      assert.equal(carrierView.incident?.capabilities.respondReopen, true);
      const notices = await IncidentNotification.find({ incidentId: id, eventType: "REOPEN_REQUESTED" }).lean();
      assert.deepEqual(notices.map((row) => row.recipientId.toString()).sort(), [ids.carrier, ids.driver].sort());
    });
  });

  await t.test("carrier approval returns the case to handling and it can be closed and requested again", async () => {
    await withServer(async (call) => {
      const { id } = await closedCase(call);
      await act(call, "shipper", id, "reopen-request", { reason: reopenReason });
      assert.equal((await act(call, "otherCarrier", id, "reopen-response", { decision: "APPROVE" })).status, 404);
      assert.equal((await act(call, "shipper", id, "reopen-response", { decision: "APPROVE" })).status, 403);
      assert.equal((await act(call, "carrier", id, "reopen-response", { decision: "MAYBE" })).status, 400);
      const approved = await act(call, "carrier", id, "reopen-response", { decision: "APPROVE" });
      assert.equal(approved.status, 200);
      assert.equal(approved.incident?.status, "IN_PROGRESS");
      assert.equal(approved.incident?.reopen.status, "APPROVED_BY_CARRIER");
      assert.equal(approved.incident?.resolutionSummary, "Đã thay lốp dự phòng, xe tiếp tục hành trình.");
      assert.equal(await escalateOverdueReopenRequests(new Date()), 0);
      assert.equal(await IncidentEvent.countDocuments({ incidentId: id, action: "REOPEN_ESCALATED_TO_ADMIN" }), 0);

      await act(call, "carrier", id, "resolve", { resolutionSummary: "Đã thay lốp mới chính hãng tại gara." });
      const reclosed = await act(call, "carrier", id, "close", { closeReason: "Kết quả xử lý XL-02: thay lốp mới." });
      assert.equal(reclosed.incident?.reopen.status, "NONE");
      assert.equal(reclosed.incident?.reopen.reason, null);
      assert.equal((await act(call, "shipper", id, "reopen-request", { reason: reopenReason })).status, 200);
      assert.deepEqual(await actions(id), [
        "CREATED",
        "ACKNOWLEDGED",
        "INVESTIGATION_STARTED",
        "RESOLVED",
        "CLOSED",
        "REOPEN_REQUESTED",
        "REOPEN_APPROVED",
        "RESOLVED",
        "CLOSED",
        "REOPEN_REQUESTED",
      ]);
    });
  });

  await t.test("carrier rejection needs a reason and refers the request to an assigned admin only", async () => {
    await withServer(async (call) => {
      const { id } = await closedCase(call);
      await act(call, "shipper", id, "reopen-request", { reason: reopenReason });
      assert.equal((await act(call, "carrier", id, "reopen-response", { decision: "REJECT" })).status, 400);
      const rejected = await act(call, "carrier", id, "reopen-response", { decision: "REJECT", note: "Lốp mới đã kiểm tra, lỗi do tải quá mức." });
      assert.equal(rejected.status, 200);
      assert.equal(rejected.incident?.status, "CLOSED");
      assert.equal(rejected.incident?.reopen.status, "AWAITING_ADMIN");
      assert.equal(rejected.incident?.reopen.escalationCause, "CARRIER_REJECTED");
      assert.equal(rejected.incident?.reopen.adminAssigned, false);
      assert.deepEqual((await actions(id)).slice(-3), ["REOPEN_REQUESTED", "REOPEN_REJECTED_BY_CARRIER", "REOPEN_ESCALATED_TO_ADMIN"]);
      const escalation = await IncidentEvent.findOne({ incidentId: id, action: "REOPEN_ESCALATED_TO_ADMIN" }).lean();
      assert.equal(escalation?.actorRole, "SYSTEM");
      assert.equal(escalation?.actorId ?? null, null);
      assert.equal(await IncidentNotification.countDocuments({ recipientId: { $in: [ids.admin, ids.otherAdmin] } }), 0);

      assert.equal((await call("admin", "GET", `/api/incidents/${id}`)).status, 404);
      assert.equal((await act(call, "admin", id, "reopen-decision", { decision: "APPROVE", reason: "Đồng ý mở lại để kiểm tra." })).status, 404);
      assert.equal((await act(call, "shipper", id, "reopen-decision", { decision: "APPROVE", reason: "Tự đồng ý mở lại cho mình." })).status, 403);
      assert.equal((await act(call, "carrier", id, "reopen-response", { decision: "APPROVE" })).status, 409);

      await Incident.updateOne({ _id: id }, { $set: { handlerId: ids.admin } });
      assert.equal((await act(call, "otherAdmin", id, "reopen-decision", { decision: "APPROVE", reason: "Quản trị khác can thiệp." })).status, 404);
      const noReason = await act(call, "admin", id, "reopen-decision", { decision: "REJECT" });
      assert.equal(noReason.status, 400);
      const adminRejected = await act(call, "admin", id, "reopen-decision", { decision: "REJECT", reason: "Bằng chứng cho thấy lỗi do tải quá mức." });
      assert.equal(adminRejected.status, 200);
      assert.equal(adminRejected.incident?.status, "CLOSED");
      assert.equal(adminRejected.incident?.reopen.status, "REJECTED_BY_ADMIN");
      assert.equal(adminRejected.incident?.reopen.adminReason, "Bằng chứng cho thấy lỗi do tải quá mức.");
      assert.equal((await act(call, "shipper", id, "reopen-request", { reason: reopenReason })).status, 409);
      const decided = await IncidentEvent.findOne({ incidentId: id, action: "ADMIN_REOPEN_REJECTED" }).lean();
      assert.equal(decided?.actorId?.toString(), ids.admin);
      assert.equal(decided?.note, "Bằng chứng cho thấy lỗi do tải quá mức.");

      const second = await closedCase(call);
      await act(call, "shipper", second.id, "reopen-request", { reason: reopenReason });
      await act(call, "carrier", second.id, "reopen-response", { decision: "REJECT", note: "Nhà xe không đồng ý mở lại." });
      await Incident.updateOne({ _id: second.id }, { $set: { handlerId: ids.admin } });
      const adminApproved = await act(call, "admin", second.id, "reopen-decision", { decision: "APPROVE", reason: "Cần kiểm tra lại lốp tại gara." });
      assert.equal(adminApproved.status, 200);
      assert.equal(adminApproved.incident?.status, "IN_PROGRESS");
      assert.equal(adminApproved.incident?.reopen.status, "APPROVED_BY_ADMIN");
    });
  });

  await t.test("no carrier response for 48 hours escalates exactly once and survives a restart", async () => {
    await withServer(async (call) => {
      const { id } = await closedCase(call);
      await act(call, "shipper", id, "reopen-request", { reason: reopenReason });
      const stored = await current(id);
      const deadline = stored.reopenCarrierDeadlineAt as Date;
      await escalateOverdueReopenRequests(new Date(deadline.getTime() - 1));
      assert.equal((await current(id)).reopenStatus, "PENDING_CARRIER");

      const late = new Date(deadline.getTime() + 1);
      await Promise.all([1, 2, 3, 4, 5].map(() => escalateOverdueReopenRequests(late)));
      const after = await current(id);
      assert.equal(after.reopenStatus, "AWAITING_ADMIN");
      assert.equal(after.reopenEscalationCause, "CARRIER_TIMEOUT");
      assert.equal(after.status, "CLOSED");
      assert.equal(await IncidentEvent.countDocuments({ incidentId: id, action: "REOPEN_ESCALATED_TO_ADMIN" }), 1);
      const notices = await IncidentNotification.find({ incidentId: id, eventType: "REOPEN_ESCALATED_TO_ADMIN" }).lean();
      assert.deepEqual(notices.map((row) => row.recipientId.toString()).sort(), [ids.shipper, ids.carrier, ids.driver].sort());

      await IncidentEvent.deleteMany({ incidentId: id, action: "REOPEN_ESCALATED_TO_ADMIN" });
      await IncidentNotification.deleteMany({ incidentId: id, eventType: "REOPEN_ESCALATED_TO_ADMIN" });
      await reconcileIncidentArtifacts();
      await reconcileIncidentArtifacts();
      assert.equal(await escalateOverdueReopenRequests(late), 0);
      assert.equal(await IncidentEvent.countDocuments({ incidentId: id, action: "REOPEN_ESCALATED_TO_ADMIN" }), 1);
      assert.equal(await IncidentNotification.countDocuments({ incidentId: id, eventType: "REOPEN_ESCALATED_TO_ADMIN" }), 3);

      const tooLate = await act(call, "carrier", id, "reopen-response", { decision: "APPROVE" });
      assert.equal(tooLate.status, 409);
      assert.equal((await current(id)).reopenStatus, "AWAITING_ADMIN");
    });
  });

  await t.test("an expired request escalates on read and a late carrier response is refused", async () => {
    await withServer(async (call) => {
      const { id } = await closedCase(call);
      await act(call, "shipper", id, "reopen-request", { reason: reopenReason });
      await Incident.updateOne({ _id: id }, { $set: { reopenCarrierDeadlineAt: new Date(Date.now() - 1000) } });
      const late = await act(call, "carrier", id, "reopen-response", { decision: "REJECT", note: "Phản hồi sau hạn 48 giờ." });
      assert.equal(late.status, 409);
      assert.equal(late.error?.code, "reopen_window_expired");
      const view = await call("shipper", "GET", `/api/incidents/${id}`);
      assert.equal(view.incident?.reopen.status, "AWAITING_ADMIN");
      assert.equal(view.incident?.reopen.escalationCause, "CARRIER_TIMEOUT");
      assert.equal(await IncidentEvent.countDocuments({ incidentId: id, action: "REOPEN_ESCALATED_TO_ADMIN" }), 1);
      assert.equal(await IncidentEvent.countDocuments({ incidentId: id, action: "REOPEN_REJECTED_BY_CARRIER" }), 0);
    });
  });

  await t.test("concurrent carrier responses and closes keep a single winner", async () => {
    await withServer(async (call) => {
      const { id } = await resolvedCase(call);
      const { version } = await current(id);
      const closes = await Promise.all(
        [1, 2, 3].map((n) => call("carrier", "POST", `/api/incidents/${id}/close`, { expectedVersion: version, idempotencyKey: nextKey(`race-close-${n}`), closeReason: "Kết quả xử lý XL-09: đã xong." })),
      );
      assert.deepEqual(closes.map((reply) => reply.status).sort(), [200, 409, 409]);
      assert.equal(await IncidentEvent.countDocuments({ incidentId: id, action: "CLOSED" }), 1);

      await act(call, "shipper", id, "reopen-request", { reason: reopenReason });
      const pending = await current(id);
      const responses = await Promise.all([
        call("carrier", "POST", `/api/incidents/${id}/reopen-response`, { expectedVersion: pending.version, idempotencyKey: nextKey("race-a"), decision: "APPROVE" }),
        call("carrier", "POST", `/api/incidents/${id}/reopen-response`, { expectedVersion: pending.version, idempotencyKey: nextKey("race-b"), decision: "REJECT", note: "Không đồng ý mở lại sự cố." }),
        escalateOverdueReopenRequests(new Date()),
      ]);
      assert.deepEqual([responses[0].status, responses[1].status].sort(), [200, 409]);
      assert.equal(responses[2], 0);
      const decisions = await IncidentEvent.countDocuments({ incidentId: id, action: { $in: ["REOPEN_APPROVED", "REOPEN_REJECTED_BY_CARRIER"] } });
      assert.equal(decisions, 1);
    });
  });
});
