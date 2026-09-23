"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createSessionCookie, verifyCredentials } from "@/lib/auth";
import { authConfigured } from "@/lib/session";

export interface LoginState {
  error?: string;
  email?: string;
  attempt?: number;
}

export async function login(prev: LoginState, fd: FormData): Promise<LoginState> {
  const email = String(fd.get("email") ?? "");
  const password = String(fd.get("password") ?? "");
  // Keep the email so the (auto-reset) form can be re-filled after an error.
  const base = { email, attempt: (prev.attempt ?? 0) + 1 };
  if (!authConfigured()) {
    return { ...base, error: "AUTH_SECRET is not configured on the server (see README → Configure .env)." };
  }
  if (!email || !password) return { ...base, error: "Email and password are required." };
  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "local";
  const result = await verifyCredentials(email, password, `${ip}:${email.toLowerCase()}`);
  if (!result.ok) {
    return {
      ...base,
      error: result.reason === "rate" ? "Too many attempts. Try again in 15 minutes." : "Invalid email or password.",
    };
  }
  await createSessionCookie({ sub: result.user.id, email: result.user.email });
  const next = String(fd.get("next") ?? "");
  redirect(next.startsWith("/admin") && !next.startsWith("//") ? next : "/admin");
}
