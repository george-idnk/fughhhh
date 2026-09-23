"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import NavLinks, { type NavItem } from "./NavLinks";

export default function MobileNav({
  items,
  secondary,
  title,
  labels,
  footer,
}: {
  items: NavItem[];
  secondary: NavItem[];
  title: string;
  labels: { menu: string; close: string; search: string };
  footer: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      <header className="sticky top-0 z-30 flex h-14 items-center gap-2 border-b border-line bg-bg/90 px-3 backdrop-blur lg:hidden">
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label={labels.menu}
          aria-expanded={open}
          className="flex h-11 w-11 items-center justify-center rounded-full text-2xl hover:bg-surface-2"
        >
          ☰
        </button>
        <Link href="/" className="min-w-0 flex-1 truncate font-display text-lg font-semibold text-crimson">
          ☦ {title}
        </Link>
        <Link
          href="/search"
          aria-label={labels.search}
          className="flex h-11 w-11 items-center justify-center rounded-full text-xl hover:bg-surface-2"
        >
          🔍
        </Link>
      </header>

      {open && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label={labels.menu}>
          <button
            type="button"
            aria-label={labels.close}
            className="absolute inset-0 bg-black/50"
            onClick={() => setOpen(false)}
          />
          <nav className="absolute inset-y-0 start-0 flex w-[86%] max-w-xs flex-col overflow-y-auto bg-surface p-3 shadow-lift">
            <div className="mb-2 flex items-center justify-between">
              <span className="font-display text-lg font-semibold text-crimson">☦ {title}</span>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label={labels.close}
                className="flex h-11 w-11 items-center justify-center rounded-full text-xl hover:bg-surface-2"
              >
                ✕
              </button>
            </div>
            <NavLinks items={items} onNavigate={() => setOpen(false)} />
            <div className="my-3 border-t border-line" />
            <NavLinks items={secondary} onNavigate={() => setOpen(false)} />
            <div className="mt-auto pt-4">{footer}</div>
          </nav>
        </div>
      )}
    </>
  );
}
