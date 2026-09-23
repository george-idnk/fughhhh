import "server-only";
import { NextResponse, type NextRequest } from "next/server";
import { getAdmin } from "./auth";
import type { SessionPayload } from "./session";

/**
 * Authenticate an admin API request. For state-changing methods the Origin header
 * must match the host (CSRF defence in addition to SameSite cookies).
 */
export async function requireAdminApi(req: NextRequest): Promise<SessionPayload | NextResponse> {
  if (req.method !== "GET" && req.method !== "HEAD") {
    const origin = req.headers.get("origin");
    const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
    if (!origin || !host || new URL(origin).host !== host) {
      return NextResponse.json({ error: "Invalid origin" }, { status: 403 });
    }
  }
  const admin = await getAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return admin;
}
