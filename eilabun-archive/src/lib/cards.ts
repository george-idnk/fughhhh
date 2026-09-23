import { CATEGORY_META, type Category, type Source, type VerificationStatus } from "./constants";
import { formatDuration, formatRecordingDate } from "./format";
import type { Dictionary, Locale } from "./i18n";
import type { RecordingView } from "./recordings";
import { displayTitle } from "./recordings";
import { resolveEmbed, youTubeThumbnail } from "./url";

/** Serializable, pre-formatted data for a recording card (safe to pass to client components). */
export interface CardData {
  id: string;
  title: string;
  category: Category;
  categoryLabel: string;
  categoryIcon: string;
  date: string | null;
  church: string | null;
  duration: string | null;
  sourceLabel: string;
  channelName: string | null;
  thumbnailUrl: string | null;
  embedSrc: string | null;
  sourceUrl: string;
  isDemo: boolean;
  isAuthorized: boolean;
  verification: VerificationStatus;
  verificationLabel: string;
}

export function toCardData(rec: RecordingView, locale: Locale, t: Dictionary): CardData {
  const category = (rec.category in CATEGORY_META ? rec.category : "OTHER") as Category;
  const embed = resolveEmbed(rec);
  return {
    id: rec.id,
    title: displayTitle(rec, locale),
    category,
    categoryLabel: t.categories[category],
    categoryIcon: CATEGORY_META[category].icon,
    date: formatRecordingDate(rec, locale),
    church: rec.church,
    duration: formatDuration(rec.duration),
    sourceLabel: t.sources[rec.source as Source] ?? rec.source,
    channelName: rec.channelName,
    thumbnailUrl: rec.thumbnailUrl || (rec.youtubeVideoId ? youTubeThumbnail(rec.youtubeVideoId) : null),
    embedSrc: embed.kind === "none" ? null : embed.src,
    sourceUrl: rec.sourceUrl,
    isDemo: rec.isDemo,
    isAuthorized: rec.isAuthorized,
    verification: rec.verification as VerificationStatus,
    verificationLabel: t.verification[rec.verification as VerificationStatus] ?? rec.verification,
  };
}

export type CardLabels = Dictionary["card"];
