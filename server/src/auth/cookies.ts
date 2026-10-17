import type { CookieOptions, Response } from "express";
import { getEnv } from "../config/env.js";
import { SESSION_MAX_AGE_MS } from "./sessionToken.js";

export const SESSION_COOKIE = "coldi_session";

export function sessionCookieOptions(): CookieOptions {
  const env = getEnv();
  return {
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE_MS,
  };
}

export function setSessionCookie(response: Response, token: string) {
  response.cookie(SESSION_COOKIE, token, sessionCookieOptions());
}

export function clearSessionCookie(response: Response) {
  const options = sessionCookieOptions();
  response.clearCookie(SESSION_COOKIE, options);
}

export function readCookie(header: string | undefined, name: string): string | null {
  if (!header) return null;
  for (const part of header.split(";")) {
    const separator = part.indexOf("=");
    if (separator === -1) continue;
    const key = part.slice(0, separator).trim();
    if (key !== name) continue;
    const value = part.slice(separator + 1).trim();
    return value.length > 0 ? decodeURIComponent(value) : null;
  }
  return null;
}
