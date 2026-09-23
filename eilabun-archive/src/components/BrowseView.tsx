import Link from "next/link";
import { toCardData } from "@/lib/cards";
import {
  AUDIO_QUALITIES,
  CATEGORIES,
  isOneOf,
  SORTS,
  VERIFICATION_STATUSES,
  type Category,
  type RecordingLanguage,
  type Source,
  type SortOrder,
} from "@/lib/constants";
import { formatNumber } from "@/lib/format";
import { fmt, type Dictionary, type Locale } from "@/lib/i18n";
import { getFilterOptions, searchRecordings } from "@/lib/recordings";
import FilterForm from "./FilterForm";
import RecordingGrid from "./RecordingGrid";
import SearchBar from "./SearchBar";

export type RawSearchParams = Record<string, string | string[] | undefined>;

const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";

export default async function BrowseView({
  t,
  locale,
  searchParams,
  fixedCategory,
  basePath,
  heading,
}: {
  t: Dictionary;
  locale: Locale;
  searchParams: RawSearchParams;
  fixedCategory?: Category;
  basePath: string;
  heading: React.ReactNode;
}) {
  const q = one(searchParams.q).slice(0, 200);
  const sortRaw = one(searchParams.sort);
  const sort: SortOrder = isOneOf(SORTS, sortRaw) ? sortRaw : q ? "relevant" : "newest";
  const params = {
    q,
    category: fixedCategory ?? one(searchParams.category),
    year: one(searchParams.year),
    language: one(searchParams.language),
    church: one(searchParams.church),
    source: one(searchParams.source),
    quality: one(searchParams.quality),
    verification: one(searchParams.verification),
    sort,
    page: Number(one(searchParams.page)) || 1,
  };
  const [result, options] = await Promise.all([searchRecordings(params, locale), getFilterOptions()]);

  const selects = [
    ...(fixedCategory
      ? []
      : [
          {
            name: "category",
            label: t.search.category,
            value: params.category,
            anyLabel: t.search.any,
            options: CATEGORIES.map((c) => ({ value: c, label: t.categories[c] })),
          },
        ]),
    {
      name: "year",
      label: t.search.year,
      value: params.year,
      anyLabel: t.search.any,
      options: options.years.map((y) => ({ value: String(y), label: String(y) })),
    },
    {
      name: "language",
      label: t.search.language,
      value: params.language,
      anyLabel: t.search.any,
      options: options.languages.map((l) => ({ value: l, label: t.languages[l as RecordingLanguage] ?? l })),
    },
    {
      name: "church",
      label: t.search.church,
      value: params.church,
      anyLabel: t.search.any,
      options: options.churches.map((c) => ({ value: c, label: c })),
    },
    {
      name: "source",
      label: t.search.source,
      value: params.source,
      anyLabel: t.search.any,
      options: options.sources.map((s) => ({ value: s, label: t.sources[s as Source] ?? s })),
    },
    {
      name: "quality",
      label: t.search.quality,
      value: params.quality,
      anyLabel: t.search.any,
      options: AUDIO_QUALITIES.filter((a) => a !== "UNKNOWN").map((a) => ({ value: a, label: `≥ ${t.quality[a]}` })),
    },
    {
      name: "verification",
      label: t.search.verification,
      value: params.verification,
      anyLabel: t.search.any,
      options: VERIFICATION_STATUSES.map((v) => ({ value: v, label: t.verification[v] })),
    },
    {
      name: "sort",
      label: t.search.sort,
      value: sort,
      options: SORTS.map((s) => ({ value: s, label: t.search.sorts[s] })),
    },
  ];

  const activeFilters = selects.filter((s) => s.name !== "sort" && s.value).length;
  const pageHref = (p: number) => {
    const sp = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) {
      if (k === "page" || (k === "category" && fixedCategory)) continue;
      if (v) sp.set(k, String(v));
    }
    if (p > 1) sp.set("page", String(p));
    const s = sp.toString();
    return s ? `${basePath}?${s}` : basePath;
  };
  const count = formatNumber(result.total, locale);

  return (
    <div className="px-4 py-6 sm:px-8 sm:py-8">
      {heading}
      <div className="mt-4 max-w-3xl">
        <SearchBar
          size="md"
          defaultValue={q}
          placeholder={t.home.searchPlaceholder}
          buttonLabel={t.home.searchButton}
          hidden={fixedCategory ? { category: fixedCategory } : undefined}
        />
      </div>

      <details className="card mt-4 p-4" open={activeFilters > 0 || undefined}>
        <summary className="flex min-h-[40px] cursor-pointer list-none items-center justify-between gap-2 font-semibold">
          <span>
            ⚙️ {t.search.filters}
            {activeFilters > 0 && (
              <span className="ms-2 rounded-full bg-crimson px-2 py-0.5 text-xs text-white">{activeFilters}</span>
            )}
          </span>
          <span className="text-sm font-normal text-muted">{t.search.showFilters} ▾</span>
        </summary>
        <div className="mt-4">
          <FilterForm
            action={basePath}
            selects={selects}
            hidden={{ q }}
            applyLabel={t.search.apply}
            resetLabel={t.search.reset}
            resetHref={basePath}
          />
        </div>
      </details>

      <p className="mt-6 text-sm text-muted" aria-live="polite">
        {q ? fmt(t.search.resultsFor, { count, q }) : fmt(t.search.results, { count })}
      </p>

      {result.items.length === 0 ? (
        <div className="card mt-4 p-8 text-center">
          <p className="text-4xl" aria-hidden>
            🕯️
          </p>
          <p className="mt-2 font-semibold">{t.search.noResults}</p>
          <p className="mt-1 text-sm text-muted">{t.search.noResultsHint}</p>
        </div>
      ) : (
        <div className="mt-4">
          <RecordingGrid items={result.items.map((r) => toCardData(r, locale, t))} labels={t.card} closeLabel={t.nav.close} />
        </div>
      )}

      {result.pages > 1 && (
        <nav className="mt-8 flex items-center justify-center gap-3" aria-label="pagination">
          {result.page > 1 ? (
            <Link href={pageHref(result.page - 1)} className="btn-ghost">
              {t.search.prev}
            </Link>
          ) : (
            <span className="btn-ghost opacity-40">{t.search.prev}</span>
          )}
          <span className="text-sm text-muted">{fmt(t.search.page, { page: result.page, pages: result.pages })}</span>
          {result.page < result.pages ? (
            <Link href={pageHref(result.page + 1)} className="btn-ghost">
              {t.search.next}
            </Link>
          ) : (
            <span className="btn-ghost opacity-40">{t.search.next}</span>
          )}
        </nav>
      )}
    </div>
  );
}
