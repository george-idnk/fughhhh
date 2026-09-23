import Link from "next/link";
import RecordingGrid from "@/components/RecordingGrid";
import SearchBar from "@/components/SearchBar";
import Section from "@/components/Section";
import { toCardData } from "@/lib/cards";
import { CATEGORIES, CATEGORY_META } from "@/lib/constants";
import { fmt } from "@/lib/i18n";
import { getI18n } from "@/lib/i18n/server";
import { formatNumber } from "@/lib/format";
import { getHomeData } from "@/lib/recordings";

export const dynamic = "force-dynamic";

const EXAMPLE_SEARCHES = ["قداس عيلبون", "ترانيم عيلبون", "مار جرجس", "Eilabun mass", "عيد القيامة", "قداس عيد الميلاد"];

export default async function HomePage() {
  const { t, locale } = await getI18n();
  const data = await getHomeData();
  const cards = (list: typeof data.recent) => list.map((r) => toCardData(r, locale, t));

  return (
    <>
      <section className="hero-pattern relative overflow-hidden px-4 pb-12 pt-10 text-white sm:px-8 sm:pb-16 sm:pt-16">
        <div aria-hidden className="pointer-events-none absolute -end-10 -top-10 select-none text-[14rem] leading-none text-white/5">
          ☦
        </div>
        <div className="relative mx-auto max-w-4xl text-center">
          <p className="mb-3 text-sm text-gold-soft/90" dir="ltr">
            ✥ <span lang="ar">عيلبون</span> · <span className="tracking-[0.3em]">EILABUN</span> · <span lang="he">עילבון</span> ✥
          </p>
          <h1 className="font-display text-4xl font-bold leading-tight sm:text-6xl" lang="en" dir="ltr">
            Eilabun Melkite Catholic Archive
          </h1>
          <p className="mx-auto mt-4 max-w-3xl font-arabic text-xl leading-relaxed text-gold-soft sm:text-2xl" lang="ar" dir="rtl">
            أرشيف الترانيم والقداديس والاحتفالات الكاثوليكية الملكية في عيلبون
          </p>
          <p className="mx-auto mt-4 max-w-2xl text-sm text-white/80 sm:text-base">{t.siteTagline}</p>
          <div className="mx-auto mt-8 max-w-2xl text-start text-ink">
            <SearchBar placeholder={t.home.searchPlaceholder} buttonLabel={t.home.searchButton} />
          </div>
          <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-sm">
            <span className="text-white/70">{t.home.exampleSearches}</span>
            {EXAMPLE_SEARCHES.map((q) => (
              <Link
                key={q}
                href={`/search?q=${encodeURIComponent(q)}`}
                dir="auto"
                className="rounded-full border border-white/25 bg-white/10 px-3 py-1.5 text-white transition hover:bg-white/20"
              >
                {q}
              </Link>
            ))}
          </div>
          {data.total > 0 && (
            <p className="mt-6 text-sm text-white/70">{fmt(t.home.stats, { count: formatNumber(data.total, locale) })}</p>
          )}
        </div>
      </section>

      {data.onlyDemo && (
        <div className="mx-4 mt-6 rounded-xl2 border border-warn/40 bg-warn/10 p-4 text-sm text-ink sm:mx-8" role="note">
          ⚠️ {t.home.demoNotice}
        </div>
      )}

      <Section title={t.home.browseCategories}>
        <div className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-2 scrollbar-none sm:mx-0 sm:grid sm:grid-cols-3 sm:overflow-visible sm:px-0 lg:grid-cols-5">
          {CATEGORIES.map((c) => (
            <Link
              key={c}
              href={`/category/${CATEGORY_META[c].slug}`}
              className="card flex min-w-[9.5rem] shrink-0 flex-col items-center gap-1 px-3 py-4 text-center transition hover:-translate-y-0.5 hover:border-gold hover:shadow-lift sm:min-w-0"
            >
              <span className="text-3xl" aria-hidden>
                {CATEGORY_META[c].icon}
              </span>
              <span className="text-sm font-semibold">{t.categories[c]}</span>
              <span className="text-xs text-muted">{formatNumber(data.categoryCounts[c] ?? 0, locale)}</span>
            </Link>
          ))}
        </div>
      </Section>

      {data.total === 0 ? (
        <p className="px-4 py-12 text-center text-muted sm:px-8">{t.home.empty}</p>
      ) : (
        <>
          {data.featured.length > 0 && (
            <Section title={`⭐ ${t.home.featured}`} href="/search?sort=relevant" linkLabel={t.home.seeAll}>
              <RecordingGrid items={cards(data.featured)} labels={t.card} closeLabel={t.nav.close} />
            </Section>
          )}
          <Section title={`🆕 ${t.home.recent}`} href="/search?sort=newest" linkLabel={t.home.seeAll}>
            <RecordingGrid items={cards(data.recent)} labels={t.card} closeLabel={t.nav.close} />
          </Section>
          <Section title={`✔ ${t.home.useful}`} href="/search?verification=VERIFIED" linkLabel={t.home.seeAll}>
            <RecordingGrid items={cards(data.useful)} labels={t.card} closeLabel={t.nav.close} />
          </Section>
        </>
      )}
    </>
  );
}
