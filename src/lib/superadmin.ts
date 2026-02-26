/**
 * SuperAdmin: cookie-based elevation, not stored in DB.
 * Use import/export to load settings when needed.
 */

import { createHmac } from "node:crypto";

const COOKIE_NAME = "sb-superadmin";
const DEFAULT_EXPIRY_DAYS = 30;

export interface SuperAdminPayload {
  userId: string;
  exp: number;
  sig: string;
}

function getSecret(): string | undefined {
  return import.meta.env?.SUPERADMIN_SECRET ?? process.env?.SUPERADMIN_SECRET;
}

function signSync(payload: string): string {
  const secret = getSecret();
  if (!secret) return "";
  return createHmac("sha256", secret).update(payload).digest("hex");
}

/** Build payload string for signing (userId|exp) */
function payloadString(userId: string, exp: number): string {
  return `${userId}|${exp}`;
}

/**
 * Create a signed SuperAdmin token for the given user.
 * Returns null if SUPERADMIN_SECRET is not set.
 */
export function createSuperAdminToken(
  userId: string,
  expiryDays: number = DEFAULT_EXPIRY_DAYS
): SuperAdminPayload | null {
  const secret = getSecret();
  if (!secret) return null;
  const exp = Date.now() + expiryDays * 24 * 60 * 60 * 1000;
  const payload = payloadString(userId, exp);
  const sig = signSync(payload);
  return { userId, exp, sig };
}

/**
 * Verify a SuperAdmin payload (signature + not expired).
 */
export function verifySuperAdminPayload(p: SuperAdminPayload): boolean {
  const secret = getSecret();
  if (!secret || !p.userId || !p.exp || !p.sig) return false;
  if (Date.now() > p.exp) return false;
  const expectedSig = signSync(payloadString(p.userId, p.exp));
  return expectedSig.length > 0 && expectedSig === p.sig;
}

export interface CookieAdapter {
  get(name: string): { value: string } | undefined;
  set(name: string, value: string, options?: Record<string, unknown>): void;
  delete(name: string, options?: Record<string, unknown>): void;
}

/**
 * Check if the request has a valid SuperAdmin cookie and it matches the given userId.
 */
export function getValidSuperAdminFromCookie(cookies: CookieAdapter, userId: string): boolean {
  const raw = cookies.get(COOKIE_NAME)?.value;
  if (!raw) return false;
  try {
    const p = JSON.parse(raw) as SuperAdminPayload;
    return verifySuperAdminPayload(p) && p.userId === userId;
  } catch {
    return false;
  }
}

/**
 * Set SuperAdmin cookie (server-side). Call from API route.
 */
export function setSuperAdminCookie(
  cookies: CookieAdapter,
  payload: SuperAdminPayload
): void {
  const value = JSON.stringify(payload);
  const isProd = import.meta.env?.PROD ?? process.env?.NODE_ENV === "production";
  cookies.set(COOKIE_NAME, value, {
    path: "/",
    httpOnly: true,
    secure: isProd,
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * DEFAULT_EXPIRY_DAYS,
  });
}

/**
 * Clear SuperAdmin cookie.
 */
export function clearSuperAdminCookie(cookies: CookieAdapter): void {
  cookies.delete(COOKIE_NAME, { path: "/" });
}

export { COOKIE_NAME };
