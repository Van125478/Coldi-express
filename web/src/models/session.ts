export type BusinessRole = "SHIPPER" | "CARRIER" | "DRIVER" | "ADMIN";

/**
 * Authenticated sessions are reserved for a future auth protocol.
 * The current client only produces the anonymous snapshot.
 */
export type SessionSnapshot =
  | { status: "anonymous" }
  | { status: "authenticated"; role: BusinessRole };
