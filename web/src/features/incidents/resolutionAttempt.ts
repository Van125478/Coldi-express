export type ResolutionAttempt = {
  key: string;
  summary: string;
  evidenceIds: string[];
  uncertain: boolean;
};

export type RecordedResolution = {
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

/** The first submit creates a key. A retry, including one with edited text or images, keeps that key. */
export function resolutionAttemptForSubmit(
  current: ResolutionAttempt | null,
  summary: string,
  evidenceIds: readonly string[],
  createKey: () => string,
): ResolutionAttempt {
  if (!current) return { key: createKey(), summary, evidenceIds: [...evidenceIds], uncertain: false };
  if (sameResolutionPayload(current, summary, evidenceIds)) return current;
  return { key: current.key, summary, evidenceIds: [...evidenceIds], uncertain: current.uncertain };
}

export function resolutionAlreadyRecorded(attempt: ResolutionAttempt, events: readonly RecordedResolution[]): boolean {
  return events.some(
    (event) =>
      event.action === "RESOLVED" &&
      event.note === attempt.summary &&
      event.evidenceIds.length === attempt.evidenceIds.length &&
      event.evidenceIds.every((id, index) => id === attempt.evidenceIds[index]),
  );
}

export function retainResolutionAttempt(status: number, code: string): boolean {
  return status === 0 || code === "network_error" || code === "incident_audit_incomplete" || status === 409 || status >= 500;
}
