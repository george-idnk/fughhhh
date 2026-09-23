"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

interface Asset {
  id: string;
  kind: string;
  parentId: string | null;
  originalName: string | null;
  sizeBytes: number;
  status: string;
  error: string | null;
  settings: string | null;
  createdAt: string;
}

const mb = (n: number) => `${(n / 1024 / 1024).toFixed(1)} MB`;

export default function AudioPanel({
  recordingId,
  isAuthorized,
  ffmpeg,
  assets,
}: {
  recordingId: string;
  isAuthorized: boolean;
  ffmpeg: boolean;
  assets: Asset[];
}) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  if (!isAuthorized) {
    return (
      <section className="card p-5">
        <h2 className="font-display text-xl font-semibold">♪ Authorized audio & enhancement</h2>
        <p className="mt-2 text-sm text-muted">
          Only available for recordings marked <strong>“Original / authorized audio”</strong> (section 6 above). Third-party
          recordings — for example YouTube videos you do not own — are never downloaded or processed; they are only linked
          and embedded.
        </p>
      </section>
    );
  }

  async function upload(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    fd.set("recordingId", recordingId);
    setBusy("upload");
    setMsg("Uploading original…");
    const res = await fetch("/api/admin/audio", { method: "POST", body: fd });
    const data = (await res.json().catch(() => ({}))) as { error?: string };
    setBusy(null);
    setMsg(res.ok ? "✔ Original stored (read-only)." : `⚠ ${data.error ?? "Upload failed"}`);
    if (res.ok) {
      (e.target as HTMLFormElement).reset();
      router.refresh();
    }
  }

  async function enhance(e: React.FormEvent<HTMLFormElement>, originalId: string) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const settings = Object.fromEntries(
      ["noiseReduction", "humReduction", "dynamicRange"].map((k) => [k, fd.get(k)]),
    ) as Record<string, unknown>;
    for (const k of ["hissReduction", "normalize", "vocalClarity", "trimSilence"]) settings[k] = fd.get(k) === "on";
    setBusy(originalId);
    setMsg("Processing with ffmpeg — this can take a while for long recordings…");
    const res = await fetch(`/api/admin/audio/${originalId}/enhance`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(settings),
    });
    const data = (await res.json().catch(() => ({}))) as { error?: string; status?: string };
    setBusy(null);
    setMsg(res.ok && data.status === "READY" ? "✔ Enhanced version created. The original is unchanged." : `⚠ ${data.error ?? "Enhancement failed — see the asset error below."}`);
    router.refresh();
  }

  async function remove(id: string) {
    if (!confirm("Delete this audio file? Deleting an original also deletes its enhanced versions.")) return;
    setBusy(id);
    await fetch(`/api/admin/audio/${id}`, { method: "DELETE" });
    setBusy(null);
    router.refresh();
  }

  const originals = assets.filter((a) => a.kind === "ORIGINAL");

  return (
    <section className="card space-y-5 p-5">
      <div>
        <h2 className="font-display text-xl font-semibold">♪ Authorized audio & enhancement</h2>
        <p className="mt-1 text-sm text-muted">
          Upload a recording you own or have permission to process. The original is stored unchanged (read-only); each
          enhancement creates a separate file. Both are published on the recording page.
        </p>
        {!ffmpeg && (
          <p className="mt-2 rounded-xl bg-warn/10 p-3 text-sm">
            ⚠ ffmpeg was not found on the server (set <code>FFMPEG_PATH</code>). Originals can be uploaded, but enhancement
            is unavailable.
          </p>
        )}
      </div>

      <form onSubmit={upload} className="space-y-3 rounded-xl border border-dashed border-line p-4">
        <label className="block">
          <span className="label">Audio/video file (mp3, wav, flac, m4a, ogg, opus, webm, mp4)</span>
          <input name="file" type="file" required accept="audio/*,video/mp4,video/webm" className="input py-2" />
        </label>
        <label className="block">
          <span className="label">Rights statement *</span>
          <input
            name="rightsStatement"
            required
            placeholder="e.g. Recorded by the parish choir; permission from Fr. … on 2025-04-20"
            className="input"
            dir="auto"
          />
        </label>
        <label className="flex items-start gap-3 text-sm">
          <input name="confirm" type="checkbox" required className="mt-1 h-5 w-5" />
          <span>I confirm I own this recording or have explicit permission from the rights holder to store and process it.</span>
        </label>
        <button type="submit" disabled={!!busy} className="btn-primary">
          {busy === "upload" ? "Uploading…" : "Upload original"}
        </button>
      </form>

      {msg && (
        <p className="text-sm" role="status">
          {msg}
        </p>
      )}

      {originals.length === 0 && <p className="text-sm text-muted">No authorized audio uploaded yet.</p>}

      {originals.map((o) => {
        const children = assets.filter((a) => a.parentId === o.id);
        return (
          <div key={o.id} className="space-y-3 rounded-xl border border-line p-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-ok/15 px-2 py-0.5 text-xs font-semibold text-ok">ORIGINAL · read-only</span>
              <span className="min-w-0 flex-1 truncate text-sm font-medium">{o.originalName}</span>
              <span className="text-xs text-muted">{mb(o.sizeBytes)}</span>
              <button type="button" onClick={() => remove(o.id)} disabled={!!busy} className="text-xs text-crimson underline">
                delete
              </button>
            </div>
            <audio controls preload="none" src={`/api/audio/${o.id}`} className="w-full" />

            {ffmpeg && (
              <form onSubmit={(e) => enhance(e, o.id)} className="grid gap-3 rounded-lg bg-surface-2 p-3 text-sm sm:grid-cols-3">
                <label>
                  <span className="label">Noise reduction</span>
                  <select name="noiseReduction" defaultValue="medium" className="input">
                    <option value="off">Off</option>
                    <option value="light">Light</option>
                    <option value="medium">Medium</option>
                    <option value="strong">Strong</option>
                  </select>
                </label>
                <label>
                  <span className="label">Hum reduction</span>
                  <select name="humReduction" defaultValue="50" className="input">
                    <option value="off">Off</option>
                    <option value="50">50 Hz (Israel/Europe)</option>
                    <option value="60">60 Hz</option>
                  </select>
                </label>
                <label>
                  <span className="label">Dynamic range</span>
                  <select name="dynamicRange" defaultValue="gentle" className="input">
                    <option value="off">Off</option>
                    <option value="gentle">Gentle compression</option>
                    <option value="strong">Strong compression</option>
                  </select>
                </label>
                {[
                  ["hissReduction", "Hiss reduction"],
                  ["vocalClarity", "Vocal/chant clarity"],
                  ["normalize", "Loudness normalization"],
                  ["trimSilence", "Trim leading/trailing silence"],
                ].map(([name, label]) => (
                  <label key={name} className="flex items-center gap-2">
                    <input type="checkbox" name={name} defaultChecked className="h-5 w-5" />
                    {label}
                  </label>
                ))}
                <div className="sm:col-span-3">
                  <button type="submit" disabled={!!busy} className="btn-gold">
                    {busy === o.id ? "Processing…" : "✨ Create enhanced version"}
                  </button>
                </div>
              </form>
            )}

            {children.map((c) => (
              <div key={c.id} className="space-y-1 border-s-2 border-gold ps-3">
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span className={`rounded-full px-2 py-0.5 font-semibold ${c.status === "READY" ? "bg-gold/20 text-gold" : "bg-crimson/10 text-crimson"}`}>
                    ENHANCED · {c.status}
                  </span>
                  <span className="text-muted">{new Date(c.createdAt).toLocaleString()}</span>
                  {c.status === "READY" && <span className="text-muted">{mb(c.sizeBytes)}</span>}
                  <button type="button" onClick={() => remove(c.id)} disabled={!!busy} className="text-crimson underline">
                    delete
                  </button>
                </div>
                {c.settings && <p className="break-all text-xs text-muted">{c.settings}</p>}
                {c.status === "READY" && <audio controls preload="none" src={`/api/audio/${c.id}`} className="w-full" />}
                {c.error && <pre className="overflow-x-auto whitespace-pre-wrap text-xs text-crimson">{c.error}</pre>}
              </div>
            ))}
          </div>
        );
      })}
    </section>
  );
}
