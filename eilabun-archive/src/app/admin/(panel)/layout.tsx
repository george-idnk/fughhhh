import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { youTubeApiKey } from "@/lib/youtube";
import { logout } from "./actions";

export const metadata: Metadata = { title: "Admin", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const admin = await requireAdmin();
  const links = [
    { href: "/admin", label: "Recordings" },
    { href: "/admin/recordings/new", label: "+ Add recording" },
    { href: "/admin/discover", label: "Discover" },
  ];
  return (
    <div dir="ltr" lang="en" className="min-h-dvh">
      <header className="sticky top-0 z-30 border-b border-line bg-surface/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-2 px-4 py-2">
          <Link href="/admin" className="me-2 font-display text-lg font-semibold text-crimson">
            ☦ Archive admin
          </Link>
          <nav className="order-last flex w-full gap-1 overflow-x-auto scrollbar-none sm:order-none sm:w-auto">
            {links.map((l) => (
              <Link key={l.href} href={l.href} className="chip shrink-0">
                {l.label}
              </Link>
            ))}
          </nav>
          <div className="ms-auto flex items-center gap-2">
            <Link href="/" className="hidden text-sm text-muted hover:text-crimson sm:inline">
              View site ↗
            </Link>
            <span className="hidden text-xs text-muted md:inline">{admin.email}</span>
            <form action={logout}>
              <button type="submit" className="btn-ghost min-h-[36px] px-3 text-xs">
                Sign out
              </button>
            </form>
          </div>
        </div>
      </header>
      {!youTubeApiKey() && (
        <div className="border-b border-warn/30 bg-warn/10 px-4 py-2 text-center text-xs text-ink">
          YOUTUBE_API_KEY is not set — automatic YouTube discovery is disabled. Manual adding (with keyless YouTube oEmbed
          metadata) and Internet Archive discovery still work.
        </div>
      )}
      <main className="mx-auto max-w-7xl px-4 py-6">{children}</main>
    </div>
  );
}
