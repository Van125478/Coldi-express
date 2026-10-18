import assert from "node:assert/strict";
import test from "node:test";
import { HttpError } from "../src/middlewares/errorHandler.js";
import { incidentEvidenceRoot } from "../src/incidents/evidence.js";

test("production incident evidence storage fails closed without an absolute directory", () => {
  const previousEnv = process.env.NODE_ENV;
  const previousDir = process.env.INCIDENT_EVIDENCE_DIR;
  try {
    process.env.NODE_ENV = "production";
    delete process.env.INCIDENT_EVIDENCE_DIR;
    assert.throws(
      () => incidentEvidenceRoot(),
      (error: unknown) => error instanceof HttpError && error.status === 503 && error.code === "incident_evidence_unavailable",
    );
    process.env.INCIDENT_EVIDENCE_DIR = "relative-evidence";
    assert.throws(
      () => incidentEvidenceRoot(),
      (error: unknown) => error instanceof HttpError && error.status === 503,
    );
  } finally {
    process.env.NODE_ENV = previousEnv;
    if (previousDir === undefined) delete process.env.INCIDENT_EVIDENCE_DIR;
    else process.env.INCIDENT_EVIDENCE_DIR = previousDir;
  }
});
