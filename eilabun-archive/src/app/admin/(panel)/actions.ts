"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { deleteAsset } from "@/lib/audio";
import { clearSessionCookie, requireAdmin } from "@/lib/auth";
import { isOneOf, VERIFICATION_STATUSES } from "@/lib/constants";
import { prisma } from "@/lib/db";
import { findDuplicate } from "@/lib/recordings";
import { canonicalizeUrl } from "@/lib/url";
import { formToObject, recordingSchema, type RecordingInput } from "@/lib/validation";

export interface RecordingFormState {
  attempt: number;
  errors?: Record<string, string>;
  message?: string;
  duplicateId?: string;
  values?: Record<string, string>;
}

function toData(v: RecordingInput) {
  return {
    title: v.title,
    originalTitle: v.originalTitle,
    titleAr: v.titleAr,
    titleEn: v.titleEn,
    titleHe: v.titleHe,
    category: v.category,
    subcategory: v.subcategory,
    event: v.event,
    date: v.date ? new Date(`${v.date}T00:00:00Z`) : null,
    year: v.date ? Number(v.date.slice(0, 4)) : v.year,
    church: v.church,
    location: v.location,
    language: v.language,
    priest: v.priest,
    choir: v.choir,
    source: v.source,
    sourceUrl: v.sourceUrl,
    canonicalUrl: canonicalizeUrl(v.sourceUrl),
    youtubeVideoId: v.youtubeVideoId,
    channelName: v.channelName,
    channelUrl: v.channelUrl,
    publishedAt: v.publishedAt ? new Date(v.publishedAt) : null,
    thumbnailUrl: v.thumbnailUrl,
    duration: v.duration,
    description: v.description,
    audioQuality: v.audioQuality,
    notes: v.notes,
    tags: JSON.stringify(v.tags),
    verification: v.verification,
    isAuthorized: v.isAuthorized,
    rightsNotes: v.rightsNotes,
    embeddable: v.embeddable,
    featured: v.featured,
    isDemo: v.isDemo,
  };
}

async function validate(
  prev: RecordingFormState,
  fd: FormData,
  excludeId?: string,
): Promise<{ state: RecordingFormState } | { data: ReturnType<typeof toData> }> {
  const values = formToObject(fd);
  const parsed = recordingSchema.safeParse(values);
  const attempt = prev.attempt + 1;
  if (!parsed.success) {
    const errors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = String(issue.path[0] ?? "form");
      errors[key] ??= issue.message;
    }
    return { state: { attempt, errors, values, message: "Please fix the highlighted fields." } };
  }
  const dup = await findDuplicate({
    youtubeVideoId: parsed.data.youtubeVideoId,
    sourceUrl: parsed.data.sourceUrl,
    excludeId,
  });
  if (dup) {
    return {
      state: {
        attempt,
        values,
        duplicateId: dup.id,
        message: `Duplicate: this source is already in the archive as “${dup.title}”.`,
        errors: { sourceUrl: "Already in the archive" },
      },
    };
  }
  return { data: toData(parsed.data) };
}

export async function createRecording(prev: RecordingFormState, fd: FormData): Promise<RecordingFormState> {
  await requireAdmin();
  const r = await validate(prev, fd);
  if ("state" in r) return r.state;
  const rec = await prisma.recording.create({ data: r.data });
  revalidatePath("/", "layout");
  redirect(`/admin/recordings/${rec.id}/edit?saved=created`);
}

export async function updateRecording(id: string, prev: RecordingFormState, fd: FormData): Promise<RecordingFormState> {
  await requireAdmin();
  const r = await validate(prev, fd, id);
  if ("state" in r) return r.state;
  await prisma.recording.update({ where: { id }, data: r.data });
  revalidatePath("/", "layout");
  redirect(`/admin/recordings/${id}/edit?saved=updated`);
}

export async function deleteRecording(fd: FormData) {
  await requireAdmin();
  const id = String(fd.get("id") ?? "");
  const assets = await prisma.audioAsset.findMany({ where: { recordingId: id, kind: "ORIGINAL" } });
  for (const a of assets) await deleteAsset(a.id);
  const leftovers = await prisma.audioAsset.findMany({ where: { recordingId: id } });
  for (const a of leftovers) await deleteAsset(a.id);
  await prisma.recording.delete({ where: { id } }).catch(() => null);
  revalidatePath("/", "layout");
  redirect("/admin?deleted=1");
}

export async function setVerification(fd: FormData) {
  await requireAdmin();
  const id = String(fd.get("id") ?? "");
  const status = fd.get("verification");
  if (!isOneOf(VERIFICATION_STATUSES, status)) return;
  await prisma.recording.update({ where: { id }, data: { verification: status } });
  revalidatePath("/", "layout");
}

export async function toggleFlag(fd: FormData) {
  await requireAdmin();
  const id = String(fd.get("id") ?? "");
  const flag = String(fd.get("flag") ?? "");
  if (flag !== "featured") return;
  const rec = await prisma.recording.findUnique({ where: { id }, select: { featured: true } });
  if (!rec) return;
  await prisma.recording.update({ where: { id }, data: { featured: !rec.featured } });
  revalidatePath("/", "layout");
}

export async function logout() {
  await clearSessionCookie();
  redirect("/admin/login");
}
