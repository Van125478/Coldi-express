import assert from "node:assert/strict";
import test from "node:test";
import {
  markResolutionUnconfirmed,
  noteResolutionFailure,
  prepareResolutionSubmit,
  resolutionAlreadyRecorded,
  resolutionAttemptForSubmit,
  retainResolutionAttempt,
  type RecordedResolution,
  type ResolutionAttempt,
} from "../../web/src/features/incidents/resolutionAttempt.ts";

const historical: RecordedResolution = { id: "event-a", action: "RESOLVED", note: "Đã thay lốp.", evidenceIds: [] };
const objection: RecordedResolution = { id: "event-b", action: "OBJECTED", note: "Chưa xử lý xong.", evidenceIds: [] };
const history = [historical, objection];

function keys() {
  let issued = 0;
  return () => {
    issued += 1;
    return `resolve-${issued}`;
  };
}

test("a historical text-only resolution is not proof that the new submission succeeded", () => {
  const createKey = keys();
  const decision = prepareResolutionSubmit(null, "Đã thay lốp.", [], history, createKey);
  assert.equal(decision.action, "submit");
  if (decision.action !== "submit") return;
  const lost = noteResolutionFailure(decision.attempt, 0, "network_error");
  const retry = prepareResolutionSubmit(lost, "Đã thay lốp.", [], history, createKey);
  assert.equal(retry.action, "submit");
  if (retry.action !== "submit") return;
  assert.equal(retry.attempt.key, decision.attempt.key);
  assert.equal(resolutionAlreadyRecorded(retry.attempt, history), false);
});

test("an objection leaves the earlier resolution in history and the retry still needs its own event", () => {
  const createKey = keys();
  const first = resolutionAttemptForSubmit(null, "Đã thay lốp.", [], [historical.id], createKey);
  const afterObjection = prepareResolutionSubmit({ ...first, uncertain: true, serverResponded: false }, "Đã thay lốp.", [], history, createKey);
  assert.equal(afterObjection.action, "submit");
  if (afterObjection.action !== "submit") return;
  assert.equal(afterObjection.attempt.knownEventIds.includes(historical.id), true);
  assert.equal(resolutionAlreadyRecorded(afterObjection.attempt, history), false);
});

test("repeated content is accepted only when a new resolution event is committed", () => {
  const attempt = resolutionAttemptForSubmit(null, "Đã thay lốp.", [], history.map((event) => event.id), () => "resolve-new");
  const committed: RecordedResolution = { id: "event-c", action: "RESOLVED", note: "Đã thay lốp.", evidenceIds: [] };
  assert.equal(resolutionAlreadyRecorded(attempt, history), false);
  assert.equal(prepareResolutionSubmit(attempt, "Đã thay lốp.", [], [...history, committed], () => "unused").action, "accept");
});

test("a successful request with a lost response is recognized from the new event id", () => {
  const attempt = resolutionAttemptForSubmit(null, "Đã thay lốp.", ["image-a"], ["event-created"], () => "resolve-1");
  const sent = markResolutionUnconfirmed(attempt);
  const recorded: RecordedResolution[] = [
    { id: "event-created", action: "CREATED", note: "Xe bị lủng lốp", evidenceIds: [] },
    { id: "event-resolved", action: "RESOLVED", note: "Đã thay lốp.", evidenceIds: ["image-a"] },
  ];
  assert.equal(sent.key, attempt.key);
  assert.deepEqual([...sent.evidenceIds], ["image-a"]);
  assert.equal(sent.uncertain, true);
  assert.equal(prepareResolutionSubmit(sent, "Nội dung đã sửa", ["image-b"], recorded, () => "resolve-2").action, "accept");
});

test("a request that never reached the server is not treated as recorded", () => {
  const attempt: ResolutionAttempt = {
    key: "resolve-1",
    summary: "Đã thay lốp.",
    evidenceIds: ["image-a"],
    knownEventIds: ["event-old"],
    uncertain: true,
    serverResponded: false,
  };
  assert.equal(
    resolutionAlreadyRecorded(attempt, [{ id: "event-old", action: "RESOLVED", note: "Đã thay lốp.", evidenceIds: ["image-a"] }]),
    false,
  );
  assert.equal(resolutionAlreadyRecorded(attempt, [{ id: "event-new", action: "RESOLVED", note: "Đã thay lốp.", evidenceIds: ["image-b"] }]), false);
  assert.equal(resolutionAlreadyRecorded(attempt, [{ id: "event-new", action: "RESOLVED", note: "Kết quả khác.", evidenceIds: ["image-a"] }]), false);
});

test("an uncertain request keeps its key and payload when the form changes", () => {
  const createKey = keys();
  const first = resolutionAttemptForSubmit(null, "Đã thay lốp.", ["image-a"], [], createKey);
  const uncertain = noteResolutionFailure(first, 0, "network_error");
  const edited = resolutionAttemptForSubmit(uncertain, "Đã thay lốp mới.", ["image-a", "image-b"], [], createKey);
  assert.equal(edited, uncertain);
  assert.equal(edited.key, "resolve-1");
  assert.equal(edited.summary, "Đã thay lốp.");
  assert.deepEqual(edited.evidenceIds, ["image-a"]);

  const decision = prepareResolutionSubmit(uncertain, "Đã thay lốp mới.", ["image-b"], history, createKey);
  assert.equal(decision.action, "submit");
  if (decision.action !== "submit") return;
  assert.equal(decision.resentFrozenPayload, true);
  assert.equal(decision.attempt.key, "resolve-1");
  assert.equal(decision.attempt.summary, "Đã thay lốp.");
  assert.deepEqual(decision.attempt.evidenceIds, ["image-a"]);
});

test("a finished non-commit can become a new submission after reconciliation", () => {
  const createKey = keys();
  const first = resolutionAttemptForSubmit(null, "Đã thay lốp.", ["image-a"], history.map((event) => event.id), createKey);
  const answered = noteResolutionFailure(first, 400, "invalid_request");
  const decision = prepareResolutionSubmit(answered, "Đã thay lốp mới.", ["image-b"], history, createKey);
  assert.equal(decision.action, "submit");
  if (decision.action !== "submit") return;
  assert.equal(decision.attempt.key, "resolve-2");
  assert.equal(decision.attempt.summary, "Đã thay lốp mới.");
  assert.deepEqual(decision.attempt.evidenceIds, ["image-b"]);
  assert.equal(resolutionAlreadyRecorded(decision.attempt, history), false);
});

test("network loss and an incomplete audit keep the resolution attempt", () => {
  assert.equal(retainResolutionAttempt(0, "network_error"), true);
  assert.equal(retainResolutionAttempt(500, "incident_audit_incomplete"), true);
  assert.equal(retainResolutionAttempt(409, "version_conflict"), true);
  assert.equal(retainResolutionAttempt(400, "invalid_request"), false);
  const attempt = resolutionAttemptForSubmit(null, "Đã thay lốp.", [], [], () => "resolve-1");
  assert.equal(noteResolutionFailure(attempt, 0, "network_error").serverResponded, false);
  assert.equal(noteResolutionFailure(attempt, 500, "incident_audit_incomplete").serverResponded, true);
});
