import { intlTag, type Locale } from "./i18n";

export function formatDuration(seconds: number | null | undefined): string | null {
  if (seconds == null || !Number.isFinite(seconds) || seconds <= 0) return null;
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  const mm = h ? String(m).padStart(2, "0") : String(m);
  return `${h ? h + ":" : ""}${mm}:${String(s).padStart(2, "0")}`;
}

/** Parse an ISO-8601 duration such as "PT1H2M3S" (YouTube API) into seconds. */
export function parseIsoDuration(iso: string | null | undefined): number | null {
  if (!iso) return null;
  const m = iso.match(/^P(?:(\d+)D)?(?:T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+(?:\.\d+)?)S)?)?$/);
  if (!m) return null;
  const [, d, h, min, s] = m;
  const total = Number(d || 0) * 86400 + Number(h || 0) * 3600 + Number(min || 0) * 60 + Math.round(Number(s || 0));
  return total || null;
}

/** Parse "1:02:03", "62:03", "3723" or "PT1H2M3S" into seconds. */
export function parseDurationInput(input: string | null | undefined): number | null {
  if (!input) return null;
  const s = input.trim();
  if (!s) return null;
  if (/^P/i.test(s)) return parseIsoDuration(s.toUpperCase());
  if (/^\d+$/.test(s)) return Number(s);
  const parts = s.split(":").map(Number);
  if (parts.some((p) => !Number.isFinite(p))) return null;
  return parts.reduce((acc, p) => acc * 60 + p, 0) || null;
}

export function formatRecordingDate(
  rec: { date: Date | null; year: number | null },
  locale: Locale,
): string | null {
  if (rec.date) {
    return new Intl.DateTimeFormat(intlTag(locale), {
      day: "numeric",
      month: "long",
      year: "numeric",
      timeZone: "UTC",
    }).format(rec.date);
  }
  return rec.year ? String(rec.year) : null;
}

export function formatDate(d: Date | null | undefined, locale: Locale): string | null {
  if (!d) return null;
  return new Intl.DateTimeFormat(intlTag(locale), { dateStyle: "medium", timeZone: "UTC" }).format(d);
}

export function formatNumber(n: number, locale: Locale): string {
  return new Intl.NumberFormat(intlTag(locale)).format(n);
}

export function parseTags(json: string | null | undefined): string[] {
  if (!json) return [];
  try {
    const v = JSON.parse(json);
    return Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : [];
  } catch {
    return [];
  }
}

/** Accepts comma / Arabic comma / newline separated tags; dedupes case-insensitively. */
export function splitTags(input: string | null | undefined): string[] {
  if (!input) return [];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of input.split(/[,،\n]/)) {
    const t = raw.trim().replace(/^#/, "");
    if (!t || t.length > 60) continue;
    const key = t.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(t);
  }
  return out.slice(0, 30);
}

/** Decode the handful of HTML entities the YouTube API returns in titles. */
export function decodeEntities(s: string): string {
  return s
    .replace(/&#(\d+);/g, (_, n: string) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n: string) => String.fromCodePoint(parseInt(n, 16)))
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&");
}
