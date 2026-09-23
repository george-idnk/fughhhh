"use client";

import Link from "next/link";
import { useState } from "react";

interface YtResult {
  videoId: string;
  title: string;
  description: string;
  channelTitle: string;
  channelUrl: string;
  publishedAt: string | null;
  thumbnailUrl: string | null;
  url: string;
  duration: number | null;
  embeddable: boolean;
  existingId: string | null;
}
interface IaResult {
  identifier: string;
  title: string;
  date: string | null;
  creator: string | null;
  mediatype: string | null;
  url: string;
  thumbnailUrl: string;
  existingId: string | null;
}

type Provider = "youtube" | "archive";

const clock = (s: number | null) => {
  if (!s) return "";
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return h ? `${h}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}` : `${m}:${String(sec).padStart(2, "0")}`;
};

function addHref(p: Record<string, string | null | undefined>) {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(p)) if (v) sp.set(k, v);
  return `/admin/recordings/new?${sp}`;
}

export default function DiscoverClient({
  hasYouTubeKey,
  suggested,
  spellings,
}: {
  hasYouTubeKey: boolean;
  suggested: string[];
  spellings: string[];
}) {
  const [q, setQ] = useState("عيلبون قداس");
  const [provider, setProvider] = useState<Provider>(hasYouTubeKey ? "youtube" : "archive");
  const [order, setOrder] = useState("relevance");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [yt, setYt] = useState<YtResult[]>([]);
  const [ia, setIa] = useState<IaResult[]>([]);
  const [next, setNext] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);

  async function run(query: string, pageToken?: string) {
    setLoading(true);
    setError(null);
    const sp = new URLSearchParams({ q: query, provider, order });
    if (pageToken) sp.set("pageToken", pageToken);
    try {
      const res = await fetch(`/api/admin/discover?${sp}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Search failed");
      if (provider === "youtube") {
        setYt((prev) => {
          const merged = pageToken ? [...prev, ...data.results] : data.results;
          const seen = new Set<string>();
          return merged.filter((r: YtResult) => !seen.has(r.videoId) && seen.add(r.videoId));
        });
        setNext(data.nextPageToken);
        setIa([]);
      } else {
        setIa(data.results);
        setYt([]);
        setNext(null);
      }
      setSearched(true);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  const archiveQuery = spellings.map((s) => `"${s}"`).join(" OR ");

  return (
    <div className="mt-5 space-y-5">
      {!hasYouTubeKey && (
        <div className="rounded-xl2 border border-warn/40 bg-warn/10 p-4 text-sm">
          <p className="font-semibold">Automatic YouTube discovery requires an API key.</p>
          <p className="mt-1">
            Add <code>YOUTUBE_API_KEY=…</code> to <code>.env</code> and restart (see README → “YouTube API”). Meanwhile you
            can search the Internet Archive here, open YouTube searches below in a new tab, and add any public link manually
            with <Link href="/admin/recordings/new" className="underline">Add recording</Link> (metadata is read from YouTube’s
            keyless oEmbed endpoint).
          </p>
        </div>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          run(q);
        }}
        className="card space-y-3 p-4"
      >
        <div className="flex flex-col gap-2 sm:flex-row">
          <input value={q} onChange={(e) => setQ(e.target.value)} dir="auto" className="input flex-1" placeholder="عيلبون قداس" />
          <select value={provider} onChange={(e) => setProvider(e.target.value as Provider)} className="input sm:w-48">
            <option value="youtube" disabled={!hasYouTubeKey}>
              YouTube{hasYouTubeKey ? "" : " (needs key)"}
            </option>
            <option value="archive">Internet Archive</option>
          </select>
          {provider === "youtube" && (
            <select value={order} onChange={(e) => setOrder(e.target.value)} className="input sm:w-40">
              <option value="relevance">Relevance</option>
              <option value="date">Newest</option>
              <option value="viewCount">Most viewed</option>
            </select>
          )}
          <button type="submit" disabled={loading || !q.trim()} className="btn-primary">
            {loading ? "Searching…" : "Search"}
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          {suggested.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => {
                setQ(s);
                run(s);
              }}
              className="chip text-xs"
              dir="auto"
            >
              {s}
            </button>
          ))}
          {provider === "archive" && (
            <button
              type="button"
              onClick={() => {
                setQ(archiveQuery);
                run(archiveQuery);
              }}
              className="chip text-xs"
            >
              All spellings of Eilabun
            </button>
          )}
        </div>
        {provider === "youtube" && (
          <p className="text-xs text-muted">Each YouTube search uses ~101 quota units (default daily quota: 10,000).</p>
        )}
      </form>

      <details className="card p-4 text-sm">
        <summary className="cursor-pointer font-semibold">Manual discovery helpers (open in a new tab)</summary>
        <p className="mt-2 text-muted">
          Search each spelling on public platforms yourself, then paste any relevant link into “Add recording”.
        </p>
        <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {spellings.map((s) => (
            <div key={s} className="flex flex-wrap items-center gap-2 rounded-lg bg-surface-2 p-2">
              <span className="me-auto font-medium" dir="auto">
                {s}
              </span>
              <a className="text-crimson underline" target="_blank" rel="noopener noreferrer" href={`https://www.youtube.com/results?search_query=${encodeURIComponent(s)}`}>
                YouTube
              </a>
              <a className="text-crimson underline" target="_blank" rel="noopener noreferrer" href={`https://www.facebook.com/search/videos/?q=${encodeURIComponent(s)}`}>
                Facebook
              </a>
              <a className="text-crimson underline" target="_blank" rel="noopener noreferrer" href={`https://archive.org/search?query=${encodeURIComponent(s)}`}>
                Archive
              </a>
            </div>
          ))}
        </div>
      </details>

      {error && (
        <p role="alert" className="rounded-xl bg-crimson/10 p-3 text-sm text-crimson">
          ⚠ {error}
        </p>
      )}

      {searched && !loading && yt.length === 0 && ia.length === 0 && !error && (
        <p className="card p-6 text-center text-muted">No public results. Try another spelling of Eilabun.</p>
      )}

      <div className="space-y-3">
        {yt.map((r) => (
          <div key={r.videoId} className="card flex flex-col gap-3 p-3 sm:flex-row">
            <a href={r.url} target="_blank" rel="noopener noreferrer" className="relative aspect-video w-full shrink-0 overflow-hidden rounded-lg bg-surface-2 sm:w-56">
              {r.thumbnailUrl && <img src={r.thumbnailUrl} alt="" className="h-full w-full object-cover" referrerPolicy="no-referrer" />}
              {r.duration && <span className="absolute bottom-1 end-1 rounded bg-black/75 px-1 text-xs text-white">{clock(r.duration)}</span>}
            </a>
            <div className="min-w-0 flex-1 text-sm">
              <p className="font-semibold" dir="auto">
                {r.title}
              </p>
              <p className="text-muted" dir="auto">
                📺 <a href={r.channelUrl} target="_blank" rel="noopener noreferrer" className="hover:underline">{r.channelTitle}</a>
                {r.publishedAt && <> · 📅 {r.publishedAt.slice(0, 10)}</>}
              </p>
              <p className="mt-1 break-all text-xs text-muted" dir="ltr">
                {r.url} · ID: <code>{r.videoId}</code>
              </p>
              {!r.embeddable && <p className="mt-1 text-xs text-warn">Embedding disabled by the uploader — will show “Open Original Source”.</p>}
              {r.description && (
                <p className="mt-1 line-clamp-2 text-xs text-muted" dir="auto">
                  {r.description}
                </p>
              )}
            </div>
            <div className="flex shrink-0 items-start gap-2">
              {r.existingId ? (
                <Link href={`/admin/recordings/${r.existingId}/edit`} className="btn-ghost min-h-[40px] text-xs">
                  ✔ Already archived
                </Link>
              ) : (
                <Link
                  href={addHref({
                    sourceUrl: r.url,
                    source: "YOUTUBE",
                    youtubeVideoId: r.videoId,
                    title: r.title,
                    originalTitle: r.title,
                    description: r.description.slice(0, 1500),
                    channelName: r.channelTitle,
                    channelUrl: r.channelUrl,
                    publishedAt: r.publishedAt?.slice(0, 10),
                    thumbnailUrl: r.thumbnailUrl,
                    duration: r.duration ? String(r.duration) : null,
                    embeddable: r.embeddable ? "on" : "",
                  })}
                  className="btn-primary min-h-[40px] text-xs"
                >
                  + Add to Archive
                </Link>
              )}
            </div>
          </div>
        ))}

        {ia.map((r) => (
          <div key={r.identifier} className="card flex flex-col gap-3 p-3 sm:flex-row">
            <a href={r.url} target="_blank" rel="noopener noreferrer" className="aspect-video w-full shrink-0 overflow-hidden rounded-lg bg-surface-2 sm:w-56">
              <img src={r.thumbnailUrl} alt="" className="h-full w-full object-cover" referrerPolicy="no-referrer" />
            </a>
            <div className="min-w-0 flex-1 text-sm">
              <p className="font-semibold" dir="auto">
                {r.title}
              </p>
              <p className="text-muted">
                {r.creator && <>👤 {r.creator} · </>}
                {r.date && <>📅 {r.date.slice(0, 10)} · </>}
                {r.mediatype}
              </p>
              <p className="mt-1 break-all text-xs text-muted" dir="ltr">
                {r.url} · ID: <code>{r.identifier}</code>
              </p>
            </div>
            <div className="shrink-0">
              {r.existingId ? (
                <Link href={`/admin/recordings/${r.existingId}/edit`} className="btn-ghost min-h-[40px] text-xs">
                  ✔ Already archived
                </Link>
              ) : (
                <Link
                  href={addHref({
                    sourceUrl: r.url,
                    source: "INTERNET_ARCHIVE",
                    title: r.title,
                    originalTitle: r.title,
                    channelName: r.creator,
                    publishedAt: r.date?.slice(0, 10),
                    thumbnailUrl: r.thumbnailUrl,
                    embeddable: "on",
                  })}
                  className="btn-primary min-h-[40px] text-xs"
                >
                  + Add to Archive
                </Link>
              )}
            </div>
          </div>
        ))}
      </div>

      {next && (
        <div className="text-center">
          <button type="button" onClick={() => run(q, next)} disabled={loading} className="btn-ghost">
            {loading ? "Loading…" : "Load more"}
          </button>
        </div>
      )}
    </div>
  );
}
