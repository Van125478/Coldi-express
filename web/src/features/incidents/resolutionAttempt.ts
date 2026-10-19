export type ResolutionAttempt = {
  key: string;
  summary: string;
  evidenceIds: string[];
  knownEventIds: readonly string[];
  uncertain: boolean;
  serverResponded: boolean;
};

export type RecordedResolution = {
  id: string;
  action: string;
  note: string | null;
  evidenceIds: readonly string[];
};

export function sameResolutionPayload(attempt: ResolutionAttempt, summary: string, evidenceIds: readonly string[]): boolean {
  return (
    attempt.summary === summary &&
    attempt.evidenceIds.length === evidenceIds.length &&
    attempt.evidenceIds.every((id, index) => id === evidenceIds[index])
  );
}

/**
 * The first submit captures one key, one payload, and the event ids already on screen.
 * While that submit's outcome is unknown, later edits do not change the key or the payload.
 * A new key starts only after that outcome is known not to have committed.
 */
export function resolutionAttemptForSubmit(
  current: ResolutionAttempt | null,
  summary: string,
  evidenceIds: readonly string[],
  knownEventIds: readonly string[],
  createKey: () => string,
): ResolutionAttempt {
  if (current?.uncertain || (current && sameResolutionPayload(current, summary, evidenceIds))) return current;
  return {
    key: createKey(),
    summary,
    evidenceIds: [...evidenceIds],
    knownEventIds: [...knownEventIds],
    uncertain: false,
    serverResponded: false,
  };
}

export function prepareResolutionSubmit(
  current: ResolutionAttempt | null,
  summary: string,
  evidenceIds: readonly string[],
  events: readonly RecordedResolution[],
  createKey: () => string,
): { action: "accept" } | { action: "submit"; attempt: ResolutionAttempt; resentFrozenPayload: boolean } {
  if (current && resolutionAlreadyRecorded(current, events)) return { action: "accept" };
  let attempt = current;
  if (attempt?.uncertain && attempt.serverResponded) attempt = { ...attempt, uncertain: false };
  const resentFrozenPayload = Boolean(attempt?.uncertain && !sameResolutionPayload(attempt, summary, evidenceIds));
  return {
    action: "submit",
    attempt: resolutionAttemptForSubmit(
      attempt,
      summary,
      evidenceIds,
      events.map((event) => event.id),
      createKey,
    ),
    resentFrozenPayload,
  };
}

/** A prior resolution with the same text is not this submission. Only a new event id can confirm it. */
export function resolutionAlreadyRecorded(attempt: ResolutionAttempt, events: readonly RecordedResolution[]): boolean {
  return events.some(
    (event) =>
      event.action === "RESOLVED" &&
      !attempt.knownEventIds.includes(event.id) &&
      event.note === attempt.summary &&
      event.evidenceIds.length === attempt.evidenceIds.length &&
      event.evidenceIds.every((id, index) => id === attempt.evidenceIds[index]),
  );
}

export function retainResolutionAttempt(status: number, code: string): boolean {
  return status === 0 || code === "network_error" || code === "incident_audit_incomplete" || status === 409 || status >= 500;
}

export function noteResolutionFailure(attempt: ResolutionAttempt, status: number, code: string): ResolutionAttempt {
  if (!retainResolutionAttempt(status, code)) return { ...attempt, uncertain: false, serverResponded: true };
  return { ...attempt, uncertain: true, serverResponded: status !== 0 && code !== "network_error" };
}

/** The resolve call was accepted, but the timeline refresh did not finish. Keep the same submission. */
export function markResolutionUnconfirmed(attempt: ResolutionAttempt): ResolutionAttempt {
  return { ...attempt, uncertain: true, serverResponded: true };
}
