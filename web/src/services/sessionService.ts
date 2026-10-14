import type { SessionSnapshot } from "@/models/session";

/**
 * Technical Handoff §4 leaves the auth protocol, token, and session model undecided.
 * The client must not treat a locally stored value as an authenticated identity.
 */
export function readSession(): SessionSnapshot {
  return { status: "anonymous" };
}
