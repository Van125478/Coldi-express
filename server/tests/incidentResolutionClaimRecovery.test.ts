import assert from "node:assert/strict";
import test, { before, after } from "node:test";
import os from "node:os";
import path from "node:path";
import mongoose, { Types } from "mongoose";
import {
  claimResolutionEvidence,
  cleanupOrphanIncidentEvidence,
  readIncidentEvidence,
  releaseAbandonedResolutionClaims,
  releaseResolutionClaim,
  RESOLUTION_CLAIM_GRACE_MS,
  storeIncidentEvidence,
} from "../src/incidents/evidence.js";
import { Incident } from "../src/models/incident.js";
import { IncidentEvent } from "../src/models/incidentEvent.js";
import { IncidentEvidence } from "../src/models/incidentEvidence.js";
import { Shipment } from "../src/models/shipment.js";
import { TINY_PNG } from "./support/cargoImage.js";

process.env.NODE_ENV = "test";
process.env.INCIDENT_EVIDENCE_DIR = path.join(os.tmpdir(), "coldi-incident-resolution-claim-test");
process.env.MONGODB_URI = "mongodb://127.0.0.1:27017/coldi_incident_resolution_claim_test";

const databaseName = "coldi_incident_resolution_claim_test";
const forbidden = new Set(["coldi", "coldi_demo_local", "admin", "local", "config"]);
const ownerId = new Types.ObjectId();
const shipperId = new Types.ObjectId();
const shipmentId = new Types.ObjectId();

async function evidence(storageKey: string) {
  const image = await IncidentEvidence.create({
    ownerId,
    contentType: "image/png",
    sizeBytes: 68,
    storageKey,
    incidentId: null,
    resolutionKey: null,
  });
  return image._id;
}

async function incident(status: "IN_PROGRESS" | "RESOLVED" = "IN_PROGRESS") {
  const created = await Incident.create({
    shipmentId,
    shipperId,
    incidentType: "VEHICLE_ISSUE",
    title: "Xe bị lủng lốp",
    description: "Xe bị lủng lốp trên quốc lộ, tài xế đang chờ thay lốp dự phòng.",
    reportedAt: new Date(),
    reporterId: shipperId,
    reporterRole: "SHIPPER",
    status,
    escalationStatus: "NONE",
    version: 2,
    idempotencyKey: `create-${new Types.ObjectId().toString()}`,
    appliedKeys: [],
  });
  return created._id;
}

async function held(id: Types.ObjectId) {
  const image = await IncidentEvidence.findById(id).lean();
  return { incidentId: image?.incidentId ? image.incidentId.toString() : null, resolutionKey: image?.resolutionKey ?? null };
}

before(async () => {
  await mongoose.connect(process.env.MONGODB_URI ?? "");
  if (mongoose.connection.name !== databaseName || forbidden.has(mongoose.connection.name)) {
    throw new Error(`Refusing to use database ${mongoose.connection.name}.`);
  }
  await mongoose.connection.dropDatabase();
});

after(async () => {
  if (mongoose.connection.name === databaseName && !forbidden.has(mongoose.connection.name)) await mongoose.connection.dropDatabase();
  await mongoose.disconnect();
});

test("interrupted resolution claims stay recoverable", async () => {
  const incidentId = await incident();
  const first = await evidence("a".repeat(32));
  const second = await evidence("b".repeat(32));
  const key = "resolve-abandoned-claim-01";

  await claimResolutionEvidence(ownerId.toString(), incidentId, key, [first.toString()]);
  assert.equal((await held(first)).resolutionKey, key);
  assert.equal(await releaseAbandonedResolutionClaims(incidentId, new Date()), 0);
  assert.equal((await held(first)).resolutionKey, key);

  const later = new Date(Date.now() + RESOLUTION_CLAIM_GRACE_MS + 1_000);
  assert.equal(await releaseAbandonedResolutionClaims(incidentId, later), 1);
  assert.deepEqual(await held(first), { incidentId: null, resolutionKey: null });
  assert.equal(await IncidentEvent.countDocuments({ incidentId, idempotencyKey: key }), 0);

  await claimResolutionEvidence(ownerId.toString(), incidentId, key, [first.toString()]);
  await claimResolutionEvidence(ownerId.toString(), incidentId, key, [second.toString()]);
  assert.deepEqual(await held(first), { incidentId: null, resolutionKey: null });
  assert.equal((await held(second)).resolutionKey, key);

  await Incident.updateOne(
    { _id: incidentId },
    {
      $set: { status: "RESOLVED", resolutionSummary: "Đã xử lý với ảnh thứ hai." },
      $addToSet: { appliedKeys: key },
      $push: {
        pendingEvents: {
          idempotencyKey: key,
          action: "RESOLVED",
          actorId: ownerId,
          actorRole: "CARRIER",
          statusBefore: "IN_PROGRESS",
          statusAfter: "RESOLVED",
          note: "Đã xử lý với ảnh thứ hai.",
          correlationId: "claim-recovery",
          evidenceIds: [second.toString()],
        },
      },
    },
  );
  await IncidentEvidence.updateOne({ _id: second }, { $set: { incidentId: null, resolutionKey: null, claimedAt: null } });
  await releaseResolutionClaim(ownerId.toString(), incidentId, key);
  assert.equal((await held(second)).incidentId, incidentId.toString());
  assert.equal((await held(second)).resolutionKey, key);
  assert.equal(await releaseAbandonedResolutionClaims(incidentId, later), 0);
  assert.equal((await held(second)).resolutionKey, key);

  const other = await evidence("c".repeat(32));
  await claimResolutionEvidence(ownerId.toString(), incidentId, key, [other.toString()]);
  assert.equal((await held(other)).resolutionKey, null);
  assert.equal((await held(second)).resolutionKey, key);

  const historical = await evidence("d".repeat(32));
  const previousKey = "resolve-historical-claim-01";
  await IncidentEvidence.updateOne({ _id: historical }, { $set: { incidentId, resolutionKey: previousKey, claimedAt: new Date(0) } });
  await IncidentEvent.create({
    incidentId,
    action: "RESOLVED",
    actorId: ownerId,
    actorRole: "CARRIER",
    occurredAt: new Date(),
    statusBefore: "IN_PROGRESS",
    statusAfter: "RESOLVED",
    escalationBefore: "NONE",
    escalationAfter: "NONE",
    note: "Kết quả trước đó.",
    evidenceIds: [historical.toString()],
    idempotencyKey: previousKey,
    correlationId: "historical-claim",
    visibility: "PARTICIPANT",
  });
  assert.equal(await releaseAbandonedResolutionClaims(incidentId, later), 0);
  assert.equal((await held(historical)).resolutionKey, previousKey);

  const foreign = await evidence("e".repeat(32));
  const partialKey = "resolve-partial-claim-01";
  await assert.rejects(
    () => claimResolutionEvidence(ownerId.toString(), incidentId, partialKey, [foreign.toString(), new Types.ObjectId().toString()]),
    (error: unknown) => error instanceof Error && "status" in error && error.status === 400,
  );
  assert.deepEqual(await held(foreign), { incidentId: null, resolutionKey: null });

  const staleUpload = await IncidentEvidence.create({
    ownerId,
    contentType: "image/png",
    sizeBytes: 68,
    storageKey: "f".repeat(32),
    incidentId: null,
    resolutionKey: null,
  });
  const reservedOld = await IncidentEvidence.create({
    ownerId,
    contentType: "image/png",
    sizeBytes: 68,
    storageKey: "1".repeat(32),
    incidentId,
    resolutionKey: "resolve-reserved-old-01",
    claimedAt: new Date(0),
  });
  const old = new Date(Date.now() - 48 * 60 * 60 * 1000);
  await IncidentEvidence.collection.updateOne({ _id: staleUpload._id }, { $set: { createdAt: old } });
  await IncidentEvidence.collection.updateOne({ _id: reservedOld._id }, { $set: { createdAt: old } });
  await cleanupOrphanIncidentEvidence();
  assert.equal(await IncidentEvidence.countDocuments({ _id: staleUpload._id }), 0);
  assert.equal(await IncidentEvidence.countDocuments({ _id: reservedOld._id }), 1);
  assert.equal(await IncidentEvidence.countDocuments({ _id: historical }), 1);
  await releaseAbandonedResolutionClaims(incidentId, later);
  await cleanupOrphanIncidentEvidence();
  assert.equal(await IncidentEvidence.countDocuments({ _id: reservedOld._id }), 0);
  assert.equal(await IncidentEvidence.countDocuments({ _id: historical }), 1);
  assert.equal(await IncidentEvidence.countDocuments({ _id: second }), 1);
});

test("cleanup that starts before the incident write cannot detach the committed resolution", async () => {
  const shipment = await Shipment.create({
    shipperId,
    cargoDescription: "Hàng lạnh kiểm thử ảnh kết quả",
    pickupLocation: "Kho A",
    deliveryLocation: "Kho B",
    temperatureGroup: "FROZEN",
    vehicleRequirement: "Xe đông lạnh",
    listedPriceVnd: 1500000,
    status: "MATCHED",
    carrierId: ownerId,
  });
  const incidentId = await incident();
  await Incident.updateOne({ _id: incidentId }, { $set: { shipmentId: shipment._id, handlerId: ownerId } });
  const current = await storeIncidentEvidence(ownerId.toString(), "image/png", TINY_PNG);
  const earlier = await storeIncidentEvidence(ownerId.toString(), "image/png", TINY_PNG);
  const key = "resolve-race-commit-01";
  const historicalKey = "resolve-race-history-01";
  await claimResolutionEvidence(ownerId.toString(), incidentId, historicalKey, [earlier.id]);
  await Incident.updateOne(
    { _id: incidentId },
    {
      $addToSet: { appliedKeys: historicalKey },
      $push: { pendingEvents: resolutionEvent(historicalKey, "Đã xử lý lần trước.", [earlier.id]) },
    },
  );
  await claimResolutionEvidence(ownerId.toString(), incidentId, key, [current.id]);
  await releaseResolutionClaim(ownerId.toString(), incidentId, key, {
    afterUncommittedRead: async () => {
      await Incident.updateOne(
        { _id: incidentId },
        {
          $set: { status: "RESOLVED" },
          $addToSet: { appliedKeys: key },
          $push: { pendingEvents: resolutionEvent(key, "Đã xử lý trước khi dọn ảnh.", [current.id]) },
        },
      );
    },
  });
  const image = await IncidentEvidence.findById(current.id).lean();
  assert.equal(image?.incidentId?.toString(), incidentId.toString());
  assert.equal(image?.resolutionKey, key);
  const historicalImage = await IncidentEvidence.findById(earlier.id).lean();
  assert.equal(historicalImage?.resolutionKey, historicalKey);
  await cleanupOrphanIncidentEvidence();
  const read = await readIncidentEvidence(current.id, { id: ownerId.toString(), role: "CARRIER" });
  assert.equal(Buffer.compare(read.bytes, TINY_PNG), 0);
  const historicalRead = await readIncidentEvidence(earlier.id, { id: ownerId.toString(), role: "CARRIER" });
  assert.equal(Buffer.compare(historicalRead.bytes, TINY_PNG), 0);
});

test("a later resolution can reuse an uncommitted reservation but not a committed image", async () => {
  const incidentId = await incident();
  const movable = await evidence("2".repeat(32));
  const committed = await evidence("3".repeat(32));
  await claimResolutionEvidence(ownerId.toString(), incidentId, "resolve-old-open-01", [movable.toString()]);
  await claimResolutionEvidence(ownerId.toString(), incidentId, "resolve-new-open-01", [movable.toString()]);
  assert.deepEqual(await held(movable), { incidentId: incidentId.toString(), resolutionKey: "resolve-new-open-01" });

  const committedKey = "resolve-old-committed-01";
  await claimResolutionEvidence(ownerId.toString(), incidentId, committedKey, [committed.toString()]);
  await Incident.updateOne(
    { _id: incidentId },
    {
      $addToSet: { appliedKeys: committedKey },
      $push: { pendingEvents: resolutionEvent(committedKey, "Ảnh đã gắn.", [committed.toString()]) },
    },
  );
  await assert.rejects(
    () => claimResolutionEvidence(ownerId.toString(), incidentId, "resolve-new-committed-01", [committed.toString()]),
    (error: unknown) => error instanceof Error && "status" in error && error.status === 400,
  );
  assert.deepEqual(await held(committed), { incidentId: incidentId.toString(), resolutionKey: committedKey });
});

function resolutionEvent(key: string, note: string, evidenceIds: string[]) {
  return {
    idempotencyKey: key,
    action: "RESOLVED" as const,
    actorId: ownerId,
    actorRole: "CARRIER" as const,
    statusBefore: "IN_PROGRESS" as const,
    statusAfter: "RESOLVED" as const,
    note,
    occurredAt: new Date(),
    correlationId: key,
    evidenceIds,
  };
}
