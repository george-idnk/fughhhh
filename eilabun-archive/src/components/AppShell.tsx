import Link from "next/link";
import { CATEGORY_META, NAV_CATEGORIES } from "@/lib/constants";
import type { Dictionary, Locale } from "@/lib/i18n";
import LanguageSwitcher from "./LanguageSwitcher";
import MobileNav from "./MobileNav";
import NavLinks, { type NavItem } from "./NavLinks";

export default function AppShell({
  t,
  locale,
  children,
}: {
  t: Dictionary;
  locale: Locale;
  children: React.ReactNode;
}) {
  const items: NavItem[] = [
    { href: "/", label: t.nav.home, icon: "🏠" },
    ...NAV_CATEGORIES.map((c) => ({
      href: `/category/${CATEGORY_META[c].slug}`,
      label: t.categories[c],
      icon: CATEGORY_META[c].icon,
    })),
  ];
  const secondary: NavItem[] = [
    { href: "/search", label: t.nav.search, icon: "🔍" },
    { href: "/about", label: t.nav.about, icon: "📖" },
  ];
  const switcher = <LanguageSwitcher current={locale} label={t.lang.label} />;

  return (
    <div className="min-h-dvh lg:flex">
      <MobileNav
        items={items}
        secondary={secondary}
        title={t.siteTitle}
        labels={{ menu: t.nav.menu, close: t.nav.close, search: t.nav.search }}
        footer={switcher}
      />

      <aside className="sticky top-0 hidden h-dvh w-72 shrink-0 flex-col border-e border-line bg-surface/70 px-3 py-5 lg:flex">
        <Link href="/" className="mb-5 block px-3">
          <span className="block text-3xl text-gold" aria-hidden>
            ☦
          </span>
          <span className="block font-display text-xl font-semibold leading-tight text-crimson">{t.siteTitle}</span>
          <span className="mt-1 block font-arabic text-sm leading-snug text-muted" lang="ar" dir="rtl">
            عيلبون · Eilabun · עילבון
          </span>
        </Link>
        <nav className="flex-1 overflow-y-auto scrollbar-none" aria-label={t.nav.browse}>
          <NavLinks items={items} />
          <div className="my-3 border-t border-line" />
          <NavLinks items={secondary} />
        </nav>
        <div className="px-1 pt-4">{switcher}</div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <main className="flex-1">{children}</main>
        <footer className="border-t border-line px-4 py-8 text-sm text-muted sm:px-8">
          <div className="ornament mb-4 text-xs">✥</div>
          <p className="mx-auto max-w-3xl text-center">{t.recording.attribution}</p>
          <p className="mt-3 text-center">
            <Link href="/about" className="underline decoration-gold/50 underline-offset-4 hover:text-crimson">
              {t.nav.about}
            </Link>
            <span className="mx-2">·</span>
            <Link href="/admin" className="underline decoration-gold/50 underline-offset-4 hover:text-crimson">
              {t.nav.admin}
            </Link>
          </p>
        </footer>
      </div>
    </div>
  );
}
