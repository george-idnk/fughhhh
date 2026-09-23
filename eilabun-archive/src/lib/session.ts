// Edge-compatible session token helpers (used by middleware and server code).
import { jwtVerify, SignJWT } from "jose";

export const SESSION_COOKIE = "eilabun_admin";
export const SESSION_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

export interface SessionPayload {
  sub: string; // admin user id
  email: string;
}

function secretKey(): Uint8Array | null {
  const s = process.env.AUTH_SECRET;
  if (!s || s.length < 32) return null;
  return new TextEncoder().encode(s);
}

export function authConfigured(): boolean {
  return secretKey() !== null;
}

export async function signSession(payload: SessionPayload): Promise<string> {
  const key = secretKey();
  if (!key) throw new Error("AUTH_SECRET is missing or shorter than 32 characters");
  return new SignJWT({ email: payload.email })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(payload.sub)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE}s`)
    .setAudience("eilabun-archive-admin")
    .sign(key);
}

export async function verifySession(token: string | undefined | null): Promise<SessionPayload | null> {
  const key = secretKey();
  if (!token || !key) return null;
  try {
    const { payload } = await jwtVerify(token, key, {
      algorithms: ["HS256"],
      audience: "eilabun-archive-admin",
    });
    if (typeof payload.sub !== "string" || typeof payload.email !== "string") return null;
    return { sub: payload.sub, email: payload.email };
  } catch {
    return null;
  }
}
