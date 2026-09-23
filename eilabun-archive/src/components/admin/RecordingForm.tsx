"use client";

import Link from "next/link";
import { useActionState, useRef, useState } from "react";
import type { RecordingFormState } from "@/app/admin/(panel)/actions";
import {
  AUDIO_QUALITIES,
  CATEGORIES,
  LANGUAGES,
  SOURCES,
  VERIFICATION_STATUSES,
} from "@/lib/constants";
import en from "@/lib/i18n/en";

type Values = Record<string, string>;
type Action = (prev: RecordingFormState, fd: FormData) => Promise<RecordingFormState>;

interface Meta {
  sourceUrl: string;
  source: string;
  title: string | null;
  description: string | null;
  thumbnailUrl: string | null;
  channelName: string | null;
  channelUrl: string | null;
  publishedAt: string | null;
  duration: number | null;
  youtubeVideoId: string | null;
  embeddable: boolean | null;
  method: string;
}

function Field({
  label,
  name,
  error,
  hint,
  children,
  wide,
}: {
  label: string;
  name: string;
  error?: string;
  hint?: string;
  children: React.ReactNode;
  wide?: boolean;
}) {
  return (
    <div className={wide ? "sm:col-span-2" : undefined}>
      <label htmlFor={name} className="label">
        {label}
      </label>
      {children}
      {hint && !error && <p className="mt-1 text-xs text-muted">{hint}</p>}
      {error && (
        <p className="mt-1 text-xs font-medium text-crimson" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

function Fieldset({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <fieldset className="card p-4 sm:p-5">
      <legend className="px-1 font-display text-lg font-semibold text-crimson">{title}</legend>
      <div className="grid gap-4 sm:grid-cols-2">{children}</div>
    </fieldset>
  );
}

function secondsToClock(s: number) {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return h ? `${h}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}` : `${m}:${String(sec).padStart(2, "0")}`;
}

export default function RecordingForm({
  action,
  initial,
  submitLabel,
  recordingId,
}: {
  action: Action;
  initial: Values;
  submitLabel: string;
  recordingId?: string;
}) {
  const [state, formAction, pending] = useActionState<RecordingFormState, FormData>(action, { attempt: 0 });
  const values = state.values ?? initial;
  const errors = state.errors ?? {};
  const formRef = useRef<HTMLFormElement>(null);
  const [metaStatus, setMetaStatus] = useState<string | null>(null);
  const [dupWarning, setDupWarning] = useState<{ id: string; title: string } | null>(null);
  const [thumbPreview, setThumbPreview] = useState(values.thumbnailUrl ?? "");
  const [authorized, setAuthorized] = useState(values.isAuthorized === "on");

  const setField = (name: string, value: string | boolean | null | undefined, onlyIfEmpty = false) => {
    const el = formRef.current?.elements.namedItem(name) as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement | null;
    if (!el || value === null || value === undefined) return;
    if (el instanceof HTMLInputElement && el.type === "checkbox") {
      el.checked = !!value;
      return;
    }
    if (onlyIfEmpty && el.value.trim()) return;
    el.value = String(value);
  };

  async function checkDuplicate(url: string, videoId?: string | null) {
    const sp = new URLSearchParams({ url });
    if (videoId) sp.set("videoId", videoId);
    if (recordingId) sp.set("excludeId", recordingId);
    const res = await fetch(`/api/admin/duplicate?${sp}`);
    if (!res.ok) return;
    const data = (await res.json()) as { duplicate: { id: string; title: string } | null };
    setDupWarning(data.duplicate);
  }

  async function fetchMetadata() {
    const url = (formRef.current?.elements.namedItem("sourceUrl") as HTMLInputElement)?.value.trim();
    if (!url) {
      setMetaStatus("Enter a source URL first.");
      return;
    }
    setMetaStatus("Reading public metadata…");
    try {
      const res = await fetch(`/api/admin/metadata?url=${encodeURIComponent(url)}`);
      const data = (await res.json()) as Meta & { error?: string };
      if (!res.ok) throw new Error(data.error ?? "Could not read metadata");
      setField("source", data.source);
      setField("youtubeVideoId", data.youtubeVideoId ?? "");
      setField("title", data.title, true);
      setField("originalTitle", data.title);
      setField("description", data.description, true);
      setField("channelName", data.channelName);
      setField("channelUrl", data.channelUrl);
      if (data.publishedAt) setField("publishedAt", data.publishedAt.slice(0, 10));
      if (data.duration) setField("duration", secondsToClock(data.duration));
      if (data.thumbnailUrl) {
        setField("thumbnailUrl", data.thumbnailUrl);
        setThumbPreview(data.thumbnailUrl);
      }
      if (data.embeddable !== null) setField("embeddable", data.embeddable);
      setMetaStatus(
        `Filled from ${data.method}.` +
          (data.embeddable === false ? " ⚠ The source does not allow embedding — visitors will get “Open Original Source”." : ""),
      );
      await checkDuplicate(url, data.youtubeVideoId);
    } catch (e) {
      setMetaStatus(`⚠ ${(e as Error).message}`);
    }
  }

  const input = (name: string, props: React.InputHTMLAttributes<HTMLInputElement> = {}) => (
    <input id={name} name={name} defaultValue={values[name] ?? ""} className="input" {...props} />
  );
  const select = (name: string, options: readonly string[], labels: Record<string, string>, allowEmpty = false) => (
    <select id={name} name={name} defaultValue={values[name] ?? ""} className="input">
      {allowEmpty && <option value="">—</option>}
      {options.map((o) => (
        <option key={o} value={o}>
          {labels[o] ?? o}
        </option>
      ))}
    </select>
  );
  const check = (name: string, label: string, onChange?: (v: boolean) => void) => (
    <label className="flex min-h-[44px] items-center gap-3 rounded-xl border border-line bg-surface px-3">
      <input
        type="checkbox"
        name={name}
        defaultChecked={values[name] === "on"}
        onChange={(e) => onChange?.(e.target.checked)}
        className="h-5 w-5 accent-[rgb(var(--crimson))]"
      />
      <span className="text-sm">{label}</span>
    </label>
  );

  return (
    <form key={state.attempt} ref={formRef} action={formAction} className="space-y-5" noValidate>
      {state.message && (
        <div role="alert" className="rounded-xl border border-crimson/30 bg-crimson/10 p-3 text-sm text-crimson">
          {state.message}{" "}
          {state.duplicateId && (
            <Link href={`/admin/recordings/${state.duplicateId}/edit`} className="font-semibold underline">
              Open existing entry
            </Link>
          )}
        </div>
      )}

      <Fieldset title="1 · Source">
        <Field label="Source URL *" name="sourceUrl" error={errors.sourceUrl} wide hint="YouTube, Facebook, church website, archive.org… The original link is always preserved.">
          <div className="flex flex-col gap-2 sm:flex-row">
            <input
              id="sourceUrl"
              name="sourceUrl"
              type="url"
              dir="ltr"
              required
              defaultValue={values.sourceUrl ?? ""}
              onBlur={(e) => e.target.value && checkDuplicate(e.target.value)}
              className="input"
              placeholder="https://www.youtube.com/watch?v=…"
            />
            <button type="button" onClick={fetchMetadata} className="btn-gold shrink-0">
              Fetch metadata
            </button>
          </div>
          {metaStatus && <p className="mt-1 text-xs text-muted">{metaStatus}</p>}
          {dupWarning && (
            <p className="mt-1 text-xs font-medium text-crimson">
              ⚠ Duplicate — already archived as “{dupWarning.title}”.{" "}
              <Link className="underline" href={`/admin/recordings/${dupWarning.id}/edit`}>
                Open
              </Link>
            </p>
          )}
        </Field>
        <Field label="Source type" name="source" error={errors.source}>
          {select("source", SOURCES, en.sources)}
        </Field>
        <Field label="YouTube video ID" name="youtubeVideoId" error={errors.youtubeVideoId} hint="Filled automatically from YouTube URLs.">
          {input("youtubeVideoId", { dir: "ltr", maxLength: 11 })}
        </Field>
        <Field label="Channel / uploader" name="channelName" error={errors.channelName}>
          {input("channelName", { dir: "auto" })}
        </Field>
        <Field label="Channel URL" name="channelUrl" error={errors.channelUrl}>
          {input("channelUrl", { dir: "ltr", type: "url" })}
        </Field>
        <Field label="Published at source" name="publishedAt" error={errors.publishedAt}>
          {input("publishedAt", { type: "date" })}
        </Field>
        <div className="flex items-end">{check("embeddable", "Source allows embedding (official player)")}</div>
        <Field label="Thumbnail URL" name="thumbnailUrl" error={errors.thumbnailUrl} wide>
          <div className="flex items-center gap-3">
            <input
              id="thumbnailUrl"
              name="thumbnailUrl"
              dir="ltr"
              type="url"
              defaultValue={values.thumbnailUrl ?? ""}
              onChange={(e) => setThumbPreview(e.target.value)}
              className="input"
            />
            {thumbPreview && (
              <img src={thumbPreview} alt="" className="h-12 w-20 shrink-0 rounded-md object-cover" referrerPolicy="no-referrer" />
            )}
          </div>
        </Field>
      </Fieldset>

      <Fieldset title="2 · Titles">
        <Field label="Title *" name="title" error={errors.title} wide>
          {input("title", { dir: "auto", required: true })}
        </Field>
        <Field label="Original title (as published)" name="originalTitle" error={errors.originalTitle} wide>
          {input("originalTitle", { dir: "auto" })}
        </Field>
        <Field label="Arabic title" name="titleAr" error={errors.titleAr}>
          {input("titleAr", { dir: "rtl", lang: "ar" })}
        </Field>
        <Field label="English title" name="titleEn" error={errors.titleEn}>
          {input("titleEn", { dir: "ltr" })}
        </Field>
        <Field label="Hebrew title" name="titleHe" error={errors.titleHe}>
          {input("titleHe", { dir: "rtl", lang: "he" })}
        </Field>
      </Fieldset>

      <Fieldset title="3 · Classification">
        <Field label="Category *" name="category" error={errors.category}>
          {select("category", CATEGORIES, en.categories)}
        </Field>
        <Field label="Secondary category" name="subcategory" error={errors.subcategory} hint="Also listed under this category.">
          {select("subcategory", CATEGORIES, en.categories, true)}
        </Field>
        <Field label="Event / feast" name="event" error={errors.event} hint="e.g. Feast of Saint George · عيد الفصح">
          {input("event", { dir: "auto" })}
        </Field>
        <Field label="Language" name="language" error={errors.language}>
          {select("language", LANGUAGES, en.languages)}
        </Field>
        <Field label="Tags" name="tags" error={errors.tags} wide hint="Comma separated, any language: قداس, Saint George, تراتيل">
          {input("tags", { dir: "auto" })}
        </Field>
      </Fieldset>

      <Fieldset title="4 · When & where">
        <Field label="Date" name="date" error={errors.date} hint="Exact date of the celebration, if known.">
          {input("date", { type: "date" })}
        </Field>
        <Field label="Year (if exact date unknown)" name="year" error={errors.year}>
          {input("year", { type: "number", min: 1900, max: 2100, inputMode: "numeric" })}
        </Field>
        <Field label="Church" name="church" error={errors.church}>
          {input("church", { dir: "auto" })}
        </Field>
        <Field label="Location" name="location" error={errors.location}>
          {input("location", { dir: "auto" })}
        </Field>
        <Field label="Priest / celebrant" name="priest" error={errors.priest}>
          {input("priest", { dir: "auto" })}
        </Field>
        <Field label="Choir / chanters" name="choir" error={errors.choir}>
          {input("choir", { dir: "auto" })}
        </Field>
      </Fieldset>

      <Fieldset title="5 · Details">
        <Field label="Description" name="description" error={errors.description} wide>
          <textarea id="description" name="description" rows={5} dir="auto" defaultValue={values.description ?? ""} className="input" />
        </Field>
        <Field label="Duration" name="duration" error={errors.duration} hint="h:mm:ss, mm:ss or seconds">
          {input("duration", { dir: "ltr", placeholder: "1:23:45" })}
        </Field>
        <Field label="Recording quality" name="audioQuality" error={errors.audioQuality}>
          {select("audioQuality", AUDIO_QUALITIES, en.quality)}
        </Field>
        <Field label="Internal notes" name="notes" error={errors.notes} wide>
          <textarea id="notes" name="notes" rows={3} dir="auto" defaultValue={values.notes ?? ""} className="input" />
        </Field>
      </Fieldset>

      <Fieldset title="6 · Status & rights">
        <Field label="Verification" name="verification" error={errors.verification} hint="Verified = confirmed to belong to Eilabun.">
          {select("verification", VERIFICATION_STATUSES, en.verification)}
        </Field>
        <div className="flex items-end">{check("featured", "★ Featured on the homepage")}</div>
        <div className="sm:col-span-2">
          {check("isAuthorized", "Original / authorized audio — I own this recording or have the rights holder’s permission", setAuthorized)}
        </div>
        {authorized && (
          <Field label="Rights / permission details *" name="rightsNotes" error={errors.rightsNotes} wide hint="Who holds the rights and what permission was given (required).">
            <textarea id="rightsNotes" name="rightsNotes" rows={2} dir="auto" defaultValue={values.rightsNotes ?? ""} className="input" />
          </Field>
        )}
        <div className="sm:col-span-2">{check("isDemo", "Demo / example entry (not a real Eilabun recording)")}</div>
      </Fieldset>

      <div className="sticky bottom-0 -mx-4 flex gap-3 border-t border-line bg-bg/95 px-4 py-3 backdrop-blur">
        <button type="submit" disabled={pending} className="btn-primary min-w-40">
          {pending ? "Saving…" : submitLabel}
        </button>
        <Link href="/admin" className="btn-ghost">
          Cancel
        </Link>
      </div>
    </form>
  );
}
