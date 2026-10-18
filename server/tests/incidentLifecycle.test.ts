import assert from "node:assert/strict";
import test from "node:test";
import { canComment, canCreate, canObject, caseScope, createDecision, type Actor, type IncidentAccess, type ShipmentAccess } from "../src/incidents/access.js";
import { closeTransition, escalationTransition, evaluateReminder, primaryTransition, reopenTransition } from "../src/incidents/lifecycle.js";
import { incidentTypeLabels, incidentTypes, readIncidentDraft } from "../src/incidents/policy.js";

const shipper: Actor = { id: "shipper-1", role: "SHIPPER" };
const carrier: Actor = { id: "carrier-1", role: "CARRIER" };
const driver: Actor = { id: "driver-1", role: "DRIVER" };
const former: Actor = { id: "driver-old", role: "DRIVER" };
const admin: Actor = { id: "admin-1", role: "ADMIN" };

const shipment: ShipmentAccess = {
  id: "shipment-1",
  shipperId: shipper.id,
  carrierId: carrier.id,
  driverId: driver.id,
  status: "IN_TRANSIT",
};

function incident(overrides: Partial<IncidentAccess> = {}): IncidentAccess {
  return {
    reporterId: shipper.id,
    reporterRole: "SHIPPER",
    handlerId: null,
    status: "OPEN",
    ...overrides,
  };
}

test("only the six approved incident categories exist", () => {
  assert.deepEqual(incidentTypes, ["TEMPERATURE_ISSUE", "VEHICLE_ISSUE", "DELAY", "CARGO_ISSUE", "PICKUP_DELIVERY_ISSUE", "OTHER"]);
  assert.equal(incidentTypeLabels.TEMPERATURE_ISSUE, "Sự cố nhiệt độ");
  assert.equal(incidentTypeLabels.VEHICLE_ISSUE, "Sự cố phương tiện");
  assert.equal(incidentTypeLabels.DELAY, "Chậm trễ");
  assert.equal(incidentTypeLabels.CARGO_ISSUE, "Sự cố hàng hóa");
  assert.equal(incidentTypeLabels.PICKUP_DELIVERY_ISSUE, "Sự cố lấy/giao hàng");
  assert.equal(incidentTypeLabels.OTHER, "Khác");
});

test("a new incident starts open and a draft requires title and description", () => {
  const missing = readIncidentDraft({ shipmentId: "a".repeat(24), incidentType: "DELAY", idempotencyKey: "create-key-1" }, undefined);
  assert.equal(missing.ok, false);
  if (!missing.ok) {
    assert.equal(missing.fields.title !== undefined, true);
    assert.equal(missing.fields.description !== undefined, true);
  }
  const invalid = readIncidentDraft(
    {
      shipmentId: "a".repeat(24),
      incidentType: "SPOILAGE",
      title: "Sự cố khác",
      description: "Mô tả đủ dài để qua kiểm tra kỹ thuật của biểu mẫu.",
      idempotencyKey: "create-key-1",
    },
    undefined,
  );
  assert.equal(invalid.ok, false);
  if (!invalid.ok) assert.equal(invalid.fields.incidentType !== undefined, true);
});

test("primary transitions follow the approved path and rejection stays in progress", () => {
  assert.deepEqual(primaryTransition("ACKNOWLEDGE", "OPEN"), { ok: true, from: "OPEN", to: "ACKNOWLEDGED" });
  assert.deepEqual(primaryTransition("START", "ACKNOWLEDGED"), { ok: true, from: "ACKNOWLEDGED", to: "IN_PROGRESS" });
  assert.deepEqual(primaryTransition("RESOLVE", "IN_PROGRESS"), { ok: true, from: "IN_PROGRESS", to: "RESOLVED" });
  assert.deepEqual(primaryTransition("OBJECT", "RESOLVED"), { ok: true, from: "RESOLVED", to: "IN_PROGRESS" });
  assert.equal(primaryTransition("RESOLVE", "OPEN").ok, false);
  assert.equal(primaryTransition("ACKNOWLEDGE", "CLOSED").ok, false);
});

test("closing stays denied until policy approval and a closed incident cannot reopen", () => {
  assert.equal(closeTransition("RESOLVED", false).ok, false);
  assert.deepEqual(closeTransition("RESOLVED", true), { ok: true, from: "RESOLVED", to: "CLOSED" });
  assert.deepEqual(reopenTransition(), { ok: false, code: "incident_reopen_denied" });
  assert.equal(primaryTransition("OBJECT", "CLOSED").ok, false);
});

test("escalation proposal does not replace the primary status", () => {
  const requested = escalationTransition("REQUEST", "NONE", "IN_PROGRESS");
  assert.equal(requested.ok, true);
  if (requested.ok) {
    assert.equal(requested.to, "REQUESTED");
    assert.equal(requested.primaryStatus, "IN_PROGRESS");
  }
  assert.equal(escalationTransition("ACTIVATE", "NONE", "OPEN").ok, false);
});

test("ownership follows the current shipment assignment", () => {
  assert.equal(canCreate(shipper, shipment), true);
  assert.equal(canCreate(carrier, shipment), true);
  assert.equal(canCreate(driver, shipment), true);
  assert.equal(canCreate(former, shipment), false);
  assert.equal(canCreate(admin, shipment), false);
  assert.equal(createDecision(shipper, { ...shipment, status: "DELIVERY_CONFIRMED" }), "window");
  assert.equal(caseScope(driver, incident({ reporterId: driver.id, reporterRole: "DRIVER" }), shipment), "participant");
  assert.equal(caseScope(former, incident({ reporterId: former.id, reporterRole: "DRIVER" }), shipment), "own_report");
  assert.equal(caseScope(former, incident(), shipment), "none");
  assert.equal(caseScope(admin, incident(), shipment), "none");
  assert.equal(caseScope(admin, incident({ handlerId: admin.id }), shipment), "participant");
  assert.equal(canObject(carrier, incident({ status: "RESOLVED" }), shipment), false);
  assert.equal(canObject(shipper, incident({ status: "RESOLVED" }), shipment), true);
  assert.equal(canComment(admin, "participant", "OPEN"), false);
});

test("reminders stay off unless a supplied configuration enables them", () => {
  const reportedAt = new Date("2026-10-18T08:00:00.000Z");
  const sample = { status: "OPEN" as const, escalationStatus: "NONE" as const, reportedAt, updatedAt: reportedAt, resolvedAt: null };
  assert.equal(evaluateReminder({ kind: "ACK_PENDING", enabled: false, intervalMinutes: 15 }, sample, new Date("2026-10-18T09:00:00.000Z")), null);
  assert.equal(evaluateReminder({ kind: "ACK_PENDING", enabled: true, intervalMinutes: null }, sample, new Date("2026-10-18T09:00:00.000Z")), null);
  assert.deepEqual(
    evaluateReminder({ kind: "ACK_PENDING", enabled: true, intervalMinutes: 30 }, sample, new Date("2026-10-18T08:31:00.000Z")),
    { kind: "ACK_PENDING" },
  );
});

test("forged identity and evidence fields are rejected before a case is stored", () => {
  const forged = readIncidentDraft(
    {
      shipmentId: "a".repeat(24),
      incidentType: "DELAY",
      title: "Chậm trễ lấy hàng",
      description: "Mô tả đủ dài để qua kiểm tra kỹ thuật của biểu mẫu.",
      idempotencyKey: "create-key-1",
      reporterId: "someone-else",
    },
    undefined,
  );
  assert.equal(forged.ok, false);
  if (!forged.ok) assert.equal(forged.code, "forged_actor");
  const images = readIncidentDraft(
    {
      shipmentId: "a".repeat(24),
      incidentType: "DELAY",
      title: "Chậm trễ lấy hàng",
      description: "Mô tả đủ dài để qua kiểm tra kỹ thuật của biểu mẫu.",
      idempotencyKey: "create-key-1",
      images: ["a.jpg"],
    },
    undefined,
  );
  assert.equal(images.ok, false);
  if (!images.ok) assert.equal(images.code, "incident_evidence_blocked");
});

test("an empty occurrence time stays empty and an earlier date is kept as entered", () => {
  const now = new Date("2026-10-18T13:00:00.000Z");
  const base = {
    shipmentId: "a".repeat(24),
    incidentType: "VEHICLE_ISSUE",
    title: "Lủng lốp trên đường",
    description: "Lốp sau bên phải bị thủng khi xe đang chạy trên quốc lộ.",
    idempotencyKey: "create-key-occurred",
  };
  const omitted = readIncidentDraft(base, undefined, now);
  assert.equal(omitted.ok, true);
  if (omitted.ok) assert.equal(omitted.draft.occurredAt, null);
  const blank = readIncidentDraft({ ...base, occurredAt: "" }, undefined, now);
  assert.equal(blank.ok, true);
  if (blank.ok) assert.equal(blank.draft.occurredAt, null);
  const earlier = readIncidentDraft({ ...base, occurredAt: "2026-10-16T10:00:00.000Z" }, undefined, now);
  assert.equal(earlier.ok, true);
  if (earlier.ok) assert.equal(earlier.draft.occurredAt?.toISOString(), "2026-10-16T10:00:00.000Z");
  const future = readIncidentDraft({ ...base, occurredAt: "2026-10-18T13:06:00.000Z" }, undefined, now);
  assert.equal(future.ok, false);
  if (!future.ok) assert.equal(future.fields.occurredAt, "Thời điểm xảy ra không được nằm ở tương lai.");
});
