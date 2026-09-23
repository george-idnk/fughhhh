import { z } from "zod";
import {
  AUDIO_QUALITIES,
  CATEGORIES,
  LANGUAGES,
  SOURCES,
  VERIFICATION_STATUSES,
} from "./constants";
import { parseDurationInput, splitTags } from "./format";
import { isHttpUrl, isValidYouTubeId, parseYouTubeId } from "./url";

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .transform((v) => (v === "" ? null : v))
    .nullable()
    .optional()
    .transform((v) => v ?? null);

const optionalUrl = z
  .string()
  .trim()
  .transform((v) => (v === "" ? null : v))
  .nullable()
  .optional()
  .transform((v) => v ?? null)
  .refine((v) => v === null || isHttpUrl(v), "Must be an http(s) URL");

const checkbox = z
  .union([z.literal("on"), z.literal("true"), z.literal("1"), z.literal(""), z.null(), z.undefined()])
  .transform((v) => v === "on" || v === "true" || v === "1");

export const recordingSchema = z
  .object({
    title: z.string().trim().min(2, "Title is required").max(300),
    originalTitle: optionalText(500),
    titleAr: optionalText(300),
    titleEn: optionalText(300),
    titleHe: optionalText(300),
    category: z.enum(CATEGORIES),
    subcategory: z
      .string()
      .optional()
      .nullable()
      .transform((v) => (v ? v : null))
      .refine((v) => v === null || (CATEGORIES as readonly string[]).includes(v), "Invalid subcategory"),
    event: optionalText(200),
    date: z
      .string()
      .optional()
      .nullable()
      .transform((v) => (v ? v : null))
      .refine((v) => v === null || /^\d{4}-\d{2}-\d{2}$/.test(v), "Use YYYY-MM-DD"),
    year: z
      .string()
      .optional()
      .nullable()
      .transform((v) => (v ? Number(v) : null))
      .refine((v) => v === null || (Number.isInteger(v) && v >= 1900 && v <= 2100), "Invalid year"),
    church: optionalText(200),
    location: z.string().trim().max(200).optional().transform((v) => v || "Eilabun"),
    language: z.enum(LANGUAGES),
    priest: optionalText(200),
    choir: optionalText(200),
    source: z.enum(SOURCES),
    sourceUrl: z.string().trim().min(1, "Source URL is required").refine(isHttpUrl, "Must be an http(s) URL"),
    youtubeVideoId: z
      .string()
      .optional()
      .nullable()
      .transform((v) => (v ? v.trim() : null))
      .refine((v) => v === null || isValidYouTubeId(v), "Invalid YouTube video id"),
    channelName: optionalText(200),
    channelUrl: optionalUrl,
    publishedAt: z
      .string()
      .optional()
      .nullable()
      .transform((v) => (v ? v : null))
      .refine((v) => v === null || !Number.isNaN(Date.parse(v)), "Invalid date"),
    thumbnailUrl: optionalUrl,
    duration: z
      .string()
      .optional()
      .nullable()
      .transform((v) => parseDurationInput(v)),
    description: optionalText(10000),
    audioQuality: z.enum(AUDIO_QUALITIES),
    notes: optionalText(5000),
    tags: z
      .string()
      .optional()
      .nullable()
      .transform((v) => splitTags(v)),
    verification: z.enum(VERIFICATION_STATUSES),
    isAuthorized: checkbox,
    rightsNotes: optionalText(2000),
    embeddable: checkbox,
    featured: checkbox,
    isDemo: checkbox,
  })
  .transform((v) => {
    // Derive the YouTube id from the URL when not given explicitly.
    const yt = v.youtubeVideoId ?? parseYouTubeId(v.sourceUrl);
    return { ...v, youtubeVideoId: yt };
  })
  .refine((v) => !v.isAuthorized || !!v.rightsNotes, {
    message: "Describe who holds the rights / what permission was given",
    path: ["rightsNotes"],
  });

export type RecordingInput = z.infer<typeof recordingSchema>;

export function formToObject(fd: FormData): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of fd.entries()) if (typeof v === "string") out[k] = v;
  return out;
}
