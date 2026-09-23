import "server-only";
import { lookup } from "node:dns/promises";
import { isIP } from "node:net";
import { decodeEntities } from "./format";
import { detectSource, parseArchiveOrgId, parseYouTubeId, youTubeThumbnail, youTubeWatchUrl } from "./url";
import { getVideos, youTubeApiKey } from "./youtube";

// Reads public metadata for a URL the administrator pasted, so the add form can be
// pre-filled. Only publicly served metadata is read (official APIs, oEmbed, or the
// page's OpenGraph tags). Nothing is downloaded or scraped beyond that.

export interface UrlMetadata {
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

function isPrivateAddress(ip: string): boolean {
  if (isIP(ip) === 4) {
    const [a, b] = ip.split(".").map(Number);
    return (
      a === 10 ||
      a === 127 ||
      a === 0 ||
      (a === 169 && b === 254) ||
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 168) ||
      (a === 100 && b >= 64 && b <= 127) ||
      a >= 224
    );
  }
  const v6 = ip.toLowerCase();
  return (
    v6 === "::1" ||
    v6 === "::" ||
    v6.startsWith("fc") ||
    v6.startsWith("fd") ||
    v6.startsWith("fe80") ||
    v6.startsWith("::ffff:127.") ||
    v6.startsWith("::ffff:10.") ||
    v6.startsWith("::ffff:192.168.")
  );
}

/** Refuse URLs that resolve to private/loopback networks (SSRF protection). */
export async function assertPublicUrl(raw: string): Promise<URL> {
  const u = new URL(raw);
  if (u.protocol !== "https:" && u.protocol !== "http:") throw new Error("Only http(s) URLs are allowed");
  if (u.username || u.password) throw new Error("URLs with credentials are not allowed");
  const host = u.hostname.replace(/^\[|\]$/g, "");
  if (host === "localhost" || host.endsWith(".local") || host.endsWith(".internal")) {
    throw new Error("Private addresses are not allowed");
  }
  const addrs = isIP(host) ? [{ address: host }] : await lookup(host, { all: true });
  if (addrs.some((a) => isPrivateAddress(a.address))) throw new Error("Private addresses are not allowed");
  return u;
}

async function safeFetch(url: string, init: RequestInit = {}, redirects = 3): Promise<Response> {
  let current = url;
  for (let i = 0; i <= redirects; i++) {
    await assertPublicUrl(current);
    const res = await fetch(current, {
      ...init,
      redirect: "manual",
      cache: "no-store",
      signal: AbortSignal.timeout(10000),
      headers: {
        "user-agent": "EilabunArchiveBot/1.0 (+catalog of public recordings; metadata only)",
        "accept-language": "ar,en;q=0.8,he;q=0.6",
        ...(init.headers ?? {}),
      },
    });
    if (res.status >= 300 && res.status < 400 && res.headers.get("location")) {
      current = new URL(res.headers.get("location")!, current).toString();
      continue;
    }
    return res;
  }
  throw new Error("Too many redirects");
}

async function readLimited(res: Response, maxBytes = 1_500_000): Promise<string> {
  if (!res.body) return "";
  const reader = res.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  while (size < maxBytes) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
    size += value.byteLength;
  }
  reader.cancel().catch(() => {});
  return new TextDecoder("utf-8").decode(Buffer.concat(chunks));
}

function metaContent(html: string, key: string): string | null {
  const re = new RegExp(
    `<meta[^>]+(?:property|name|itemprop)=["']${key.replace(/[.:]/g, "\\$&")}["'][^>]*>`,
    "i",
  );
  const tag = html.match(re)?.[0];
  if (!tag) return null;
  const c = tag.match(/content=["']([^"']*)["']/i)?.[1];
  return c ? decodeEntities(c).trim() : null;
}

function empty(sourceUrl: string, method: string): UrlMetadata {
  return {
    sourceUrl,
    source: detectSource(sourceUrl),
    title: null,
    description: null,
    thumbnailUrl: null,
    channelName: null,
    channelUrl: null,
    publishedAt: null,
    duration: null,
    youtubeVideoId: null,
    embeddable: null,
    method,
  };
}

async function youTubeMetadata(id: string): Promise<UrlMetadata> {
  const base = { ...empty(youTubeWatchUrl(id), "youtube"), youtubeVideoId: id, source: "YOUTUBE" };
  if (youTubeApiKey()) {
    const [v] = await getVideos([id]);
    if (v) {
      return {
        ...base,
        title: v.title,
        description: v.description,
        thumbnailUrl: v.thumbnailUrl,
        channelName: v.channelTitle,
        channelUrl: v.channelUrl,
        publishedAt: v.publishedAt,
        duration: v.duration,
        embeddable: v.embeddable,
        method: "youtube-data-api",
      };
    }
  }
  // Keyless fallback: the official oEmbed endpoint. A 401 means embedding is disabled.
  const res = await fetch(
    `https://www.youtube.com/oembed?format=json&url=${encodeURIComponent(youTubeWatchUrl(id))}`,
    { cache: "no-store", signal: AbortSignal.timeout(10000) },
  ).catch(() => null);
  if (res?.ok) {
    const o = (await res.json()) as { title?: string; author_name?: string; author_url?: string; thumbnail_url?: string };
    return {
      ...base,
      title: o.title ?? null,
      channelName: o.author_name ?? null,
      channelUrl: o.author_url ?? null,
      thumbnailUrl: youTubeThumbnail(id),
      embeddable: true,
      method: "youtube-oembed",
    };
  }
  return {
    ...base,
    thumbnailUrl: youTubeThumbnail(id),
    embeddable: res?.status === 401 ? false : null,
    method: "youtube-id-only",
  };
}

async function archiveOrgMetadata(url: string, id: string): Promise<UrlMetadata> {
  const res = await safeFetch(`https://archive.org/metadata/${encodeURIComponent(id)}`);
  const base = { ...empty(url, "internet-archive"), source: "INTERNET_ARCHIVE" };
  if (!res.ok) return base;
  const data = (await res.json()) as {
    metadata?: { title?: string | string[]; description?: string | string[]; creator?: string | string[]; date?: string; publicdate?: string };
  };
  const first = (v?: string | string[]) => (Array.isArray(v) ? v[0] : v) ?? null;
  const m = data.metadata ?? {};
  return {
    ...base,
    title: first(m.title),
    description: first(m.description)?.replace(/<[^>]+>/g, " ").trim() ?? null,
    channelName: first(m.creator),
    publishedAt: m.publicdate ?? m.date ?? null,
    thumbnailUrl: `https://archive.org/services/img/${encodeURIComponent(id)}`,
    embeddable: true,
  };
}

export async function fetchUrlMetadata(rawUrl: string): Promise<UrlMetadata> {
  const yt = parseYouTubeId(rawUrl);
  if (yt) return youTubeMetadata(yt);
  const ia = parseArchiveOrgId(rawUrl);
  if (ia) return archiveOrgMetadata(rawUrl, ia);

  const res = await safeFetch(rawUrl, { headers: { accept: "text/html,application/xhtml+xml" } });
  const meta = empty(rawUrl, "opengraph");
  if (!res.ok || !(res.headers.get("content-type") ?? "").includes("html")) return meta;
  const html = await readLimited(res);
  const titleTag = html.match(/<title[^>]*>([^<]*)<\/title>/i)?.[1];
  return {
    ...meta,
    title: metaContent(html, "og:title") ?? (titleTag ? decodeEntities(titleTag).trim() : null),
    description: metaContent(html, "og:description") ?? metaContent(html, "description"),
    thumbnailUrl: metaContent(html, "og:image"),
    channelName: metaContent(html, "og:site_name"),
    publishedAt: metaContent(html, "article:published_time") ?? metaContent(html, "uploadDate"),
    // Only official players are embedded; generic pages open at the source.
    embeddable: false,
  };
}

export interface ArchiveOrgResult {
  identifier: string;
  title: string;
  date: string | null;
  creator: string | null;
  mediatype: string | null;
  url: string;
  thumbnailUrl: string;
}

/** Keyless search of the Internet Archive's public catalog (audio & video items). */
export async function searchInternetArchive(q: string, rows = 25): Promise<ArchiveOrgResult[]> {
  const query = `(${q}) AND (mediatype:audio OR mediatype:movies)`;
  const url = new URL("https://archive.org/advancedsearch.php");
  url.searchParams.set("q", query);
  for (const f of ["identifier", "title", "date", "creator", "mediatype"]) url.searchParams.append("fl[]", f);
  url.searchParams.set("rows", String(rows));
  url.searchParams.set("output", "json");
  const res = await fetch(url, { cache: "no-store", signal: AbortSignal.timeout(15000) });
  if (!res.ok) throw new Error(`Internet Archive error ${res.status}`);
  const data = (await res.json()) as {
    response?: { docs?: { identifier: string; title?: string; date?: string; creator?: string | string[]; mediatype?: string }[] };
  };
  return (data.response?.docs ?? []).map((d) => ({
    identifier: d.identifier,
    title: d.title ?? d.identifier,
    date: d.date ?? null,
    creator: Array.isArray(d.creator) ? d.creator[0] : (d.creator ?? null),
    mediatype: d.mediatype ?? null,
    url: `https://archive.org/details/${d.identifier}`,
    thumbnailUrl: `https://archive.org/services/img/${encodeURIComponent(d.identifier)}`,
  }));
}
