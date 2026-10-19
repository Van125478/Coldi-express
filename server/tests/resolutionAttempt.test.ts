import assert from "node:assert/strict";
import test from "node:test";
import {
  resolutionAlreadyRecorded,
  resolutionAttemptForSubmit,
  retainResolutionAttempt,
  type ResolutionAttempt,
} from "../../web/src/features/incidents/resolutionAttempt.ts";

test("a resolution retry keeps one key and the original payload", () => {
  let issued = 0;
  const createKey = () => {
    issued += 1;
    return `resolve-${issued}`;
  };
  const first = resolutionAttemptForSubmit(null, "Đã thay lốp.", ["image-a"], createKey);
  const retry = resolutionAttemptForSubmit(first, "Đã thay lốp.", ["image-a"], createKey);
  assert.equal(retry, first);
  assert.equal(retry.key, "resolve-1");
  assert.equal(issued, 1);

  const edited = resolutionAttemptForSubmit({ ...first, uncertain: true }, "Đã thay lốp mới.", ["image-a", "image-b"], createKey);
  assert.equal(edited.key, "resolve-1");
  assert.deepEqual(edited.evidenceIds, ["image-a", "image-b"]);
  assert.equal(edited.uncertain, true);
  assert.equal(issued, 1);

  const nextAction = resolutionAttemptForSubmit(null, "Đã thay lốp mới.", ["image-a", "image-b"], createKey);
  assert.equal(nextAction.key, "resolve-2");
  assert.equal(issued, 2);
});

test("a lost resolution response is recognized from the recorded event", () => {
  const attempt: ResolutionAttempt = {
    key: "resolve-1",
    summary: "Đã thay lốp.",
    evidenceIds: ["image-a"],
    uncertain: true,
  };
  assert.equal(
    resolutionAlreadyRecorded(attempt, [
      { action: "CREATED", note: "Xe bị lủng lốp", evidenceIds: [] },
      { action: "RESOLVED", note: "Đã thay lốp.", evidenceIds: ["image-a"] },
    ]),
    true,
  );
  assert.equal(resolutionAlreadyRecorded(attempt, [{ action: "RESOLVED", note: "Đã thay lốp.", evidenceIds: ["image-b"] }]), false);
  assert.equal(resolutionAlreadyRecorded(attempt, [{ action: "RESOLVED", note: "Kết quả khác.", evidenceIds: ["image-a"] }]), false);
});

test("network loss and an incomplete audit keep the resolution attempt", () => {
  assert.equal(retainResolutionAttempt(0, "network_error"), true);
  assert.equal(retainResolutionAttempt(500, "incident_audit_incomplete"), true);
  assert.equal(retainResolutionAttempt(409, "version_conflict"), true);
  assert.equal(retainResolutionAttempt(400, "invalid_request"), false);
});
