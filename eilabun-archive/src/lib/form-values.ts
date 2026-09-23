import type { Recording } from "@prisma/client";
import { parseTags } from "./format";

const d = (v: Date | null) => (v ? v.toISOString().slice(0, 10) : "");
const b = (v: boolean) => (v ? "on" : "");

function clock(s: number | null) {
  if (!s) return "";
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return h ? `${h}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}` : `${m}:${String(sec).padStart(2, "0")}`;
}

export function recordingToFormValues(r: Recording): Record<string, string> {
  return {
    title: r.title,
    originalTitle: r.originalTitle ?? "",
    titleAr: r.titleAr ?? "",
    titleEn: r.titleEn ?? "",
    titleHe: r.titleHe ?? "",
    category: r.category,
    subcategory: r.subcategory ?? "",
    event: r.event ?? "",
    date: d(r.date),
    year: r.date ? "" : r.year ? String(r.year) : "",
    church: r.church ?? "",
    location: r.location,
    language: r.language,
    priest: r.priest ?? "",
    choir: r.choir ?? "",
    source: r.source,
    sourceUrl: r.sourceUrl,
    youtubeVideoId: r.youtubeVideoId ?? "",
    channelName: r.channelName ?? "",
    channelUrl: r.channelUrl ?? "",
    publishedAt: d(r.publishedAt),
    thumbnailUrl: r.thumbnailUrl ?? "",
    duration: clock(r.duration),
    description: r.description ?? "",
    audioQuality: r.audioQuality,
    notes: r.notes ?? "",
    tags: parseTags(r.tags).join(", "),
    verification: r.verification,
    isAuthorized: b(r.isAuthorized),
    rightsNotes: r.rightsNotes ?? "",
    embeddable: b(r.embeddable),
    featured: b(r.featured),
    isDemo: b(r.isDemo),
  };
}

export const EMPTY_FORM_VALUES: Record<string, string> = {
  category: "OTHER",
  language: "ar",
  source: "YOUTUBE",
  audioQuality: "UNKNOWN",
  verification: "UNVERIFIED",
  location: "Eilabun",
  embeddable: "on",
};

/** Prefill keys accepted from the discovery page (query string). */
export const PREFILL_KEYS = [
  "sourceUrl",
  "source",
  "title",
  "originalTitle",
  "description",
  "channelName",
  "channelUrl",
  "publishedAt",
  "thumbnailUrl",
  "duration",
  "youtubeVideoId",
  "embeddable",
] as const;
