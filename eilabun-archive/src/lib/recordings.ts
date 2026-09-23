import "server-only";
import type { Prisma, Recording } from "@prisma/client";
import { prisma } from "./db";
import {
  AUDIO_QUALITY_RANK,
  CATEGORIES,
  isOneOf,
  OLD_RECORDING_BEFORE_YEAR,
  RECENT_RECORDING_YEARS,
  VERIFICATION_RANK,
  type AudioQuality,
  type Category,
  type SortOrder,
  type VerificationStatus,
} from "./constants";
import { parseTags } from "./format";
import { getDictionary, LOCALES, type Locale } from "./i18n";
import { parseQuery, prepareField, scoreDocument, type SearchableField } from "./search";
import { canonicalizeUrl } from "./url";

export type RecordingView = Omit<Recording, "tags"> & { tags: string[] };

export function toView(rec: Recording): RecordingView {
  return { ...rec, tags: parseTags(rec.tags) };
}

export function displayTitle(rec: Pick<Recording, "title" | "titleAr" | "titleEn" | "titleHe">, locale: Locale) {
  const localized = locale === "ar" ? rec.titleAr : locale === "he" ? rec.titleHe : rec.titleEn;
  return localized?.trim() || rec.title;
}

/** Effective year used for filtering/sorting. */
export function recordingYear(rec: Pick<Recording, "date" | "year">): number | null {
  return rec.date ? rec.date.getUTCFullYear() : rec.year;
}

function sortTime(rec: Recording): number | null {
  if (rec.date) return rec.date.getTime();
  if (rec.year) return Date.UTC(rec.year, 6, 1);
  if (rec.publishedAt) return rec.publishedAt.getTime();
  return null;
}

/**
 * Prisma filter for a category page. "Old" and "Recent" recordings also include
 * items whose date places them there, not only items explicitly categorised.
 */
export function categoryWhere(category: Category): Prisma.RecordingWhereInput {
  if (category === "OLD_RECORDINGS") {
    const cutoff = new Date(Date.UTC(OLD_RECORDING_BEFORE_YEAR, 0, 1));
    return {
      OR: [
        { category },
        { date: { lt: cutoff } },
        { AND: [{ date: null }, { year: { lt: OLD_RECORDING_BEFORE_YEAR } }] },
      ],
    };
  }
  if (category === "RECENT_RECORDINGS") {
    const fromYear = new Date().getUTCFullYear() - RECENT_RECORDING_YEARS;
    const cutoff = new Date(Date.UTC(fromYear, 0, 1));
    return {
      OR: [
        { category },
        { date: { gte: cutoff } },
        { AND: [{ date: null }, { year: { gte: fromYear } }] },
      ],
    };
  }
  return { OR: [{ category }, { subcategory: category }] };
}

function searchableFields(rec: Recording): SearchableField[] {
  const tags = parseTags(rec.tags).join(" ");
  const categoryLabels = LOCALES.map((l) => getDictionary(l).categories[rec.category as Category] ?? "").join(" ");
  const subLabels = rec.subcategory
    ? LOCALES.map((l) => getDictionary(l).categories[rec.subcategory as Category] ?? rec.subcategory).join(" ")
    : "";
  const dateText = [
    rec.date?.toISOString().slice(0, 10),
    recordingYear(rec)?.toString(),
    rec.publishedAt?.toISOString().slice(0, 4),
  ]
    .filter(Boolean)
    .join(" ");
  const f = (text: string | null | undefined, weight: number) => ({ text: prepareField(text), weight });
  return [
    f(rec.title, 10),
    f(rec.titleAr, 10),
    f(rec.titleEn, 10),
    f(rec.titleHe, 10),
    f(rec.originalTitle, 9),
    f(tags, 6),
    f(rec.event, 6),
    f(categoryLabels, 5),
    f(subLabels, 4),
    f(rec.church, 5),
    f(rec.priest, 5),
    f(rec.choir, 4),
    f(dateText, 4),
    f(rec.location, 3),
    f(rec.channelName, 3),
    f(rec.description, 2),
    f(rec.notes, 1),
  ].filter((x) => x.text);
}

export interface SearchParams {
  q?: string;
  category?: string;
  year?: string;
  language?: string;
  church?: string;
  source?: string;
  quality?: string;
  verification?: string;
  sort?: SortOrder;
  page?: number;
  pageSize?: number;
  includeDemo?: boolean;
}

export interface SearchResult {
  items: RecordingView[];
  total: number;
  page: number;
  pages: number;
}

export async function searchRecordings(params: SearchParams, locale: Locale): Promise<SearchResult> {
  const and: Prisma.RecordingWhereInput[] = [];
  if (params.category && isOneOf(CATEGORIES, params.category)) and.push(categoryWhere(params.category));
  if (params.language) and.push({ language: params.language });
  if (params.church) and.push({ church: params.church });
  if (params.source) and.push({ source: params.source });
  if (params.verification) and.push({ verification: params.verification });
  if (params.quality) {
    // "Good" means good or better.
    const min = AUDIO_QUALITY_RANK[params.quality as AudioQuality];
    if (min !== undefined) {
      const ok = (Object.keys(AUDIO_QUALITY_RANK) as AudioQuality[]).filter((k) => AUDIO_QUALITY_RANK[k] >= min);
      and.push({ audioQuality: { in: ok } });
    }
  }
  const year = params.year ? Number(params.year) : NaN;
  if (Number.isInteger(year)) {
    and.push({
      OR: [
        { date: { gte: new Date(Date.UTC(year, 0, 1)), lt: new Date(Date.UTC(year + 1, 0, 1)) } },
        { AND: [{ date: null }, { year }] },
      ],
    });
  }

  const rows = await prisma.recording.findMany({ where: and.length ? { AND: and } : undefined });

  const concepts = parseQuery(params.q ?? "");
  let scored: { rec: Recording; matched: number; score: number }[];
  if (concepts.length) {
    scored = rows
      .map((rec) => ({ rec, ...scoreDocument(searchableFields(rec), concepts) }))
      .filter((r) => r.matched > 0);
    // Prefer documents matching every concept; fall back to partial matches only if none do.
    const full = scored.filter((r) => r.matched === concepts.length);
    if (full.length) scored = full;
  } else {
    scored = rows.map((rec) => ({ rec, matched: 0, score: 0 }));
  }

  const sort: SortOrder = params.sort ?? "relevant";
  const collator = new Intl.Collator(locale);
  const byTime = (dir: 1 | -1) => (a: Recording, b: Recording) => {
    const ta = sortTime(a);
    const tb = sortTime(b);
    if (ta === null && tb === null) return b.discoveredAt.getTime() - a.discoveredAt.getTime();
    if (ta === null) return 1; // unknown dates last
    if (tb === null) return -1;
    return dir * (ta - tb);
  };
  scored.sort((a, b) => {
    switch (sort) {
      case "newest":
        return byTime(-1)(a.rec, b.rec);
      case "oldest":
        return byTime(1)(a.rec, b.rec);
      case "alpha":
        return collator.compare(displayTitle(a.rec, locale), displayTitle(b.rec, locale));
      default:
        return b.matched - a.matched || b.score - a.score || usefulness(b.rec) - usefulness(a.rec);
    }
  });

  const pageSize = params.pageSize ?? 24;
  const total = scored.length;
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const page = Math.min(Math.max(1, params.page ?? 1), pages);
  const items = scored.slice((page - 1) * pageSize, page * pageSize).map((r) => toView(r.rec));
  return { items, total, page, pages };
}

/** Heuristic for "most useful": verified, good audio, described, authorized, watched. */
export function usefulness(rec: Recording): number {
  return (
    VERIFICATION_RANK[rec.verification as VerificationStatus] * 30 +
    (AUDIO_QUALITY_RANK[rec.audioQuality as AudioQuality] ?? 0) * 10 +
    (rec.description ? 5 : 0) +
    (rec.isAuthorized ? 10 : 0) +
    (rec.featured ? 8 : 0) +
    Math.log10(rec.views + 1) * 6 -
    (rec.isDemo ? 50 : 0)
  );
}

export async function getHomeData() {
  const [featured, recent, all, total, demoCount] = await Promise.all([
    prisma.recording.findMany({ where: { featured: true }, orderBy: { discoveredAt: "desc" }, take: 8 }),
    prisma.recording.findMany({ orderBy: { discoveredAt: "desc" }, take: 8 }),
    prisma.recording.findMany({ take: 500, orderBy: { discoveredAt: "desc" } }),
    prisma.recording.count(),
    prisma.recording.count({ where: { isDemo: true } }),
  ]);
  const useful = [...all].sort((a, b) => usefulness(b) - usefulness(a)).slice(0, 8);
  const counts = await prisma.recording.groupBy({ by: ["category"], _count: { _all: true } });
  const categoryCounts = Object.fromEntries(counts.map((c) => [c.category, c._count._all])) as Record<string, number>;
  return {
    featured: featured.map(toView),
    recent: recent.map(toView),
    useful: useful.map(toView),
    total,
    onlyDemo: total > 0 && demoCount === total,
    categoryCounts,
  };
}

export async function getFilterOptions() {
  const rows = await prisma.recording.findMany({
    select: { date: true, year: true, church: true, language: true, source: true },
  });
  const years = new Set<number>();
  const churches = new Set<string>();
  const languages = new Set<string>();
  const sources = new Set<string>();
  for (const r of rows) {
    const y = recordingYear(r);
    if (y) years.add(y);
    if (r.church) churches.add(r.church);
    languages.add(r.language);
    sources.add(r.source);
  }
  return {
    years: [...years].sort((a, b) => b - a),
    churches: [...churches].sort(),
    languages: [...languages],
    sources: [...sources],
  };
}

export async function getRecording(id: string): Promise<RecordingView | null> {
  const rec = await prisma.recording.findUnique({ where: { id } });
  return rec ? toView(rec) : null;
}

export async function getRelated(rec: RecordingView, take = 6): Promise<RecordingView[]> {
  const candidates = await prisma.recording.findMany({
    where: {
      id: { not: rec.id },
      OR: [
        { category: rec.category },
        ...(rec.event ? [{ event: rec.event }] : []),
        ...(rec.church ? [{ church: rec.church }] : []),
      ],
    },
    take: 60,
  });
  const tagSet = new Set(rec.tags.map((t) => t.toLowerCase()));
  const score = (c: Recording) =>
    (c.category === rec.category ? 3 : 0) +
    (rec.event && c.event === rec.event ? 4 : 0) +
    (rec.church && c.church === rec.church ? 1 : 0) +
    parseTags(c.tags).filter((t) => tagSet.has(t.toLowerCase())).length * 2 +
    usefulness(c) / 100;
  return candidates
    .sort((a, b) => score(b) - score(a))
    .slice(0, take)
    .map(toView);
}

export interface DuplicateCheck {
  youtubeVideoId?: string | null;
  sourceUrl?: string | null;
  excludeId?: string;
}

/** Find an existing recording with the same YouTube id, canonical URL or source URL. */
export async function findDuplicate(input: DuplicateCheck): Promise<Recording | null> {
  const or: Prisma.RecordingWhereInput[] = [];
  if (input.youtubeVideoId) or.push({ youtubeVideoId: input.youtubeVideoId });
  if (input.sourceUrl) {
    or.push({ sourceUrl: input.sourceUrl.trim() });
    try {
      or.push({ canonicalUrl: canonicalizeUrl(input.sourceUrl) });
    } catch {
      /* invalid URL — validated elsewhere */
    }
  }
  if (!or.length) return null;
  return prisma.recording.findFirst({
    where: { OR: or, ...(input.excludeId ? { id: { not: input.excludeId } } : {}) },
  });
}

/** Map of youtubeVideoId/canonicalUrl → recording id, used by the discovery page. */
export async function existingIdsFor(videoIds: string[], urls: string[]) {
  const canon = urls.flatMap((u) => {
    try {
      return [canonicalizeUrl(u)];
    } catch {
      return [];
    }
  });
  const rows = await prisma.recording.findMany({
    where: { OR: [{ youtubeVideoId: { in: videoIds } }, { canonicalUrl: { in: canon } }] },
    select: { id: true, youtubeVideoId: true, canonicalUrl: true },
  });
  const map = new Map<string, string>();
  for (const r of rows) {
    if (r.youtubeVideoId) map.set(r.youtubeVideoId, r.id);
    map.set(r.canonicalUrl, r.id);
  }
  return map;
}
