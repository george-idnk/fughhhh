// Shared vocabularies. Stored as strings in the database so the schema works on
// both SQLite and PostgreSQL; validated here.

export const CATEGORIES = [
  "DIVINE_LITURGY",
  "HYMNS",
  "BYZANTINE_CHANTS",
  "PRAYERS",
  "CHRISTMAS",
  "EASTER",
  "PALM_SUNDAY",
  "SAINT_GEORGE",
  "FEAST_DAYS",
  "PROCESSIONS",
  "CELEBRATIONS",
  "YOUTH",
  "OLD_RECORDINGS",
  "RECENT_RECORDINGS",
  "OTHER",
] as const;
export type Category = (typeof CATEGORIES)[number];

export const CATEGORY_META: Record<Category, { slug: string; icon: string }> = {
  DIVINE_LITURGY: { slug: "divine-liturgies", icon: "⛪" },
  HYMNS: { slug: "hymns", icon: "🎵" },
  BYZANTINE_CHANTS: { slug: "byzantine-chants", icon: "🎶" },
  PRAYERS: { slug: "prayers", icon: "🙏" },
  CHRISTMAS: { slug: "christmas", icon: "🎄" },
  EASTER: { slug: "easter", icon: "✝️" },
  PALM_SUNDAY: { slug: "palm-sunday", icon: "🌿" },
  SAINT_GEORGE: { slug: "saint-george", icon: "⛪" },
  FEAST_DAYS: { slug: "feast-days", icon: "🕯️" },
  PROCESSIONS: { slug: "processions", icon: "🚶" },
  CELEBRATIONS: { slug: "celebrations", icon: "🎉" },
  YOUTH: { slug: "youth", icon: "🌟" },
  OLD_RECORDINGS: { slug: "old-recordings", icon: "📜" },
  RECENT_RECORDINGS: { slug: "recent-recordings", icon: "🆕" },
  OTHER: { slug: "other", icon: "📁" },
};

/** Sidebar order requested for the navigation menu. */
export const NAV_CATEGORIES: Category[] = [
  "DIVINE_LITURGY",
  "HYMNS",
  "BYZANTINE_CHANTS",
  "PRAYERS",
  "CHRISTMAS",
  "EASTER",
  "PALM_SUNDAY",
  "SAINT_GEORGE",
  "CELEBRATIONS",
  "OLD_RECORDINGS",
  "RECENT_RECORDINGS",
];

export function categoryFromSlug(slug: string): Category | null {
  const entry = (Object.entries(CATEGORY_META) as [Category, { slug: string }][]).find(
    ([, m]) => m.slug === slug,
  );
  return entry ? entry[0] : null;
}

/** Recordings dated before this year also appear under "Old Recordings". */
export const OLD_RECORDING_BEFORE_YEAR = 2010;
/** Recordings from the last N years also appear under "Recent Recordings". */
export const RECENT_RECORDING_YEARS = 2;

export const SOURCES = [
  "YOUTUBE",
  "FACEBOOK",
  "CHURCH_WEBSITE",
  "INTERNET_ARCHIVE",
  "AUDIO_ARCHIVE",
  "VIDEO_ARCHIVE",
  "AUTHORIZED_UPLOAD",
  "OTHER",
] as const;
export type Source = (typeof SOURCES)[number];

export const LANGUAGES = ["ar", "en", "he", "el", "mixed"] as const;
export type RecordingLanguage = (typeof LANGUAGES)[number];

export const AUDIO_QUALITIES = ["UNKNOWN", "POOR", "FAIR", "GOOD", "EXCELLENT"] as const;
export type AudioQuality = (typeof AUDIO_QUALITIES)[number];
export const AUDIO_QUALITY_RANK: Record<AudioQuality, number> = {
  UNKNOWN: 0,
  POOR: 1,
  FAIR: 2,
  GOOD: 3,
  EXCELLENT: 4,
};

export const VERIFICATION_STATUSES = ["UNVERIFIED", "REVIEWED", "VERIFIED"] as const;
export type VerificationStatus = (typeof VERIFICATION_STATUSES)[number];
export const VERIFICATION_RANK: Record<VerificationStatus, number> = {
  UNVERIFIED: 0,
  REVIEWED: 1,
  VERIFIED: 2,
};

export const SORTS = ["relevant", "newest", "oldest", "alpha"] as const;
export type SortOrder = (typeof SORTS)[number];

/**
 * Known spellings of Eilabun. Used for search tolerance and for the discovery
 * helper (one query per spelling).
 */
export const EILABUN_SPELLINGS = [
  "عيلبون",
  "إيلبون",
  "إيلابن",
  "عيلابون",
  "Eilabun",
  "Eilaboun",
  "Ilabun",
  "Ailabun",
  "Ilaboun",
  "Eilaboon",
  "עילבון",
  "עילאבון",
] as const;

export const DEMO_TITLE_PREFIX = "Example recording — replace with verified source";

export function isOneOf<T extends readonly string[]>(list: T, v: unknown): v is T[number] {
  return typeof v === "string" && (list as readonly string[]).includes(v);
}
