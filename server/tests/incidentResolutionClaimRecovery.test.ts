import assert from "node:assert/strict";
import test, { before, after } from "node:test";
import os from "node:os";
import path from "node:path";
import mongoose, { Types } from "mongoose";
import {
  claimResolutionEvidence,
  cleanupOrphanIncidentEvidence,
  releaseAbandonedResolutionClaims,
  releaseResolutionClaim,
  RESOLUTION_CLAIM_GRACE_MS,
} from "../src/incidents/evidence.js";
import { Incident } from "../src/models/incident.js";
import { IncidentEvent } from "../src/models/incidentEvent.js";
import { IncidentEvidence } from "../src/models/incidentEvidence.js";

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
