import "server-only";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "./db";
import { SESSION_COOKIE, SESSION_MAX_AGE, signSession, verifySession, type SessionPayload } from "./session";

// Simple in-memory brute-force protection (per process). For multi-instance
// deployments put a rate limiter in front of /admin/login as well.
const attempts = new Map<string, { count: number; first: number }>();
const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 8;

export function loginRateLimited(key: string): boolean {
  const now = Date.now();
  const a = attempts.get(key);
  if (!a || now - a.first > WINDOW_MS) return false;
  return a.count >= MAX_ATTEMPTS;
}

function recordFailure(key: string) {
  const now = Date.now();
  const a = attempts.get(key);
  if (!a || now - a.first > WINDOW_MS) attempts.set(key, { count: 1, first: now });
  else a.count++;
}

export async function verifyCredentials(email: string, password: string, rateKey: string) {
  if (loginRateLimited(rateKey)) return { ok: false as const, reason: "rate" as const };
  const user = await prisma.adminUser.findUnique({ where: { email: email.trim().toLowerCase() } });
  // Always run bcrypt to keep timing similar for unknown users.
  const hash = user?.passwordHash ?? "$2b$12$2W1EqmUFUK9mmknEujyL3O88UP87zXvvlIlZYGD/uOdBRv3AXBo.G";
  const valid = await bcrypt.compare(password, hash);
  if (!user || !valid) {
    recordFailure(rateKey);
    return { ok: false as const, reason: "invalid" as const };
  }
  attempts.delete(rateKey);
  await prisma.adminUser.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
  return { ok: true as const, user };
}

export async function createSessionCookie(payload: SessionPayload) {
  const token = await signSession(payload);
  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
}

export async function clearSessionCookie() {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}

/** Current admin, or null. Also confirms the account still exists. */
export async function getAdmin(): Promise<SessionPayload | null> {
  const store = await cookies();
  const session = await verifySession(store.get(SESSION_COOKIE)?.value);
  if (!session) return null;
  const exists = await prisma.adminUser.findUnique({ where: { id: session.sub }, select: { id: true } });
  return exists ? session : null;
}

/** Use in admin pages and server actions. Redirects to login when not authenticated. */
export async function requireAdmin(): Promise<SessionPayload> {
  const admin = await getAdmin();
  if (!admin) redirect("/admin/login");
  return admin;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}
