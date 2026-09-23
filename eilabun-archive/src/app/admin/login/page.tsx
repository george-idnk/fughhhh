import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getAdmin } from "@/lib/auth";
import LoginForm from "./LoginForm";

export const metadata: Metadata = { title: "Admin sign in", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  if (await getAdmin()) redirect("/admin");
  const { next } = await searchParams;
  return (
    <div dir="ltr" lang="en" className="flex min-h-dvh items-center justify-center px-4 py-10">
      <div className="card w-full max-w-sm p-6">
        <p className="text-center text-4xl text-gold" aria-hidden>
          ☦
        </p>
        <h1 className="mt-2 text-center font-display text-2xl font-semibold text-crimson">Archive administration</h1>
        <p className="mb-6 mt-1 text-center text-sm text-muted">Authorized administrators only.</p>
        <LoginForm next={next ?? "/admin"} />
        <p className="mt-6 text-center text-sm">
          <Link href="/" className="text-muted hover:text-crimson">
            ← Back to the archive
          </Link>
        </p>
      </div>
    </div>
  );
}
