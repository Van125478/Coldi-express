import { jwtVerify, SignJWT } from "jose";

export const SESSION_MAX_AGE_MS = 12 * 60 * 60 * 1000;

export async function signSessionToken(userId: string, secret: string, sessionVersion = 0): Promise<string> {
  return new SignJWT({ sv: sessionVersion })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(userId)
    .setIssuedAt()
    .setExpirationTime("12h")
    .sign(new TextEncoder().encode(secret));
}

export async function readSession(token: string, secret: string): Promise<{ userId: string; sessionVersion: number } | null> {
  try {
    const { payload } = await jwtVerify(token, new TextEncoder().encode(secret), {
      algorithms: ["HS256"],
    });
    if (typeof payload.sub !== "string" || payload.sub.length === 0) return null;
    const version = payload.sv;
    const sessionVersion = typeof version === "number" && Number.isInteger(version) && version >= 0 ? version : 0;
    return { userId: payload.sub, sessionVersion };
  } catch {
    return null;
  }
}
