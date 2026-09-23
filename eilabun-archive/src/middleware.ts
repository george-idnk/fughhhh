import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, verifySession } from "@/lib/session";

// First line of defence for the admin UI. Every admin page, server action and
// admin API route also re-checks the session on the server.
export async function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;
  if (pathname === "/admin/login") return NextResponse.next();
  const session = await verifySession(req.cookies.get(SESSION_COOKIE)?.value);
  if (!session) {
    const url = req.nextUrl.clone();
    url.pathname = "/admin/login";
    url.search = `?next=${encodeURIComponent(pathname + search)}`;
    return NextResponse.redirect(url);
  }
  const res = NextResponse.next();
  res.headers.set("Cache-Control", "no-store");
  res.headers.set("X-Robots-Tag", "noindex, nofollow");
  return res;
}

// API routes are excluded on purpose: they authenticate themselves (see
// src/lib/admin-api.ts) and large audio uploads must not be buffered here.
export const config = { matcher: ["/admin", "/admin/:path*"] };
