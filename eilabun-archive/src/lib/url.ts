// URL helpers: canonicalization (for duplicate detection), YouTube id parsing,
// and embed URL resolution for sources that officially support embedding.

const YT_ID = /^[A-Za-z0-9_-]{11}$/;

export function isValidYouTubeId(id: string | null | undefined): id is string {
  return !!id && YT_ID.test(id);
}

/** Extract a YouTube video id from any common YouTube URL form (or a bare id). */
export function parseYouTubeId(input: string | null | undefined): string | null {
  if (!input) return null;
  const s = input.trim();
  if (YT_ID.test(s)) return s;
  let u: URL;
  try {
    u = new URL(s);
  } catch {
    return null;
  }
  const host = u.hostname.replace(/^(www\.|m\.|music\.)/, "");
  if (host === "youtu.be") {
    const id = u.pathname.split("/")[1];
    return isValidYouTubeId(id) ? id : null;
  }
  if (host === "youtube.com" || host === "youtube-nocookie.com") {
    const v = u.searchParams.get("v");
    if (isValidYouTubeId(v)) return v;
    const m = u.pathname.match(/^\/(?:embed|shorts|live|v)\/([A-Za-z0-9_-]{11})/);
    if (m) return m[1];
  }
  return null;
}

const TRACKING_PARAMS = [
  /^utm_/i,
  /^fbclid$/i,
  /^gclid$/i,
  /^si$/i,
  /^feature$/i,
  /^ref$/i,
  /^mibextid$/i,
  /^igshid$/i,
];

/**
 * Canonical form of a source URL, used to detect duplicates:
 *  - YouTube → https://www.youtube.com/watch?v=<id>
 *  - otherwise: https, lower-case host without "www."/"m.", no fragment,
 *    no tracking parameters, sorted query, no trailing slash.
 */
export function canonicalizeUrl(input: string): string {
  const yt = parseYouTubeId(input);
  if (yt) return `https://www.youtube.com/watch?v=${yt}`;
  const u = new URL(input.trim());
  u.protocol = "https:";
  u.hostname = u.hostname.toLowerCase().replace(/^(www\.|m\.|mobile\.)/, "");
  if (u.hostname === "fb.com") u.hostname = "facebook.com";
  u.hash = "";
  u.port = "";
  const params = [...u.searchParams.entries()]
    .filter(([k]) => !TRACKING_PARAMS.some((re) => re.test(k)))
    .sort(([a], [b]) => a.localeCompare(b));
  u.search = "";
  for (const [k, v] of params) u.searchParams.append(k, v);
  if (u.pathname.length > 1) u.pathname = u.pathname.replace(/\/+$/, "");
  const out = u.toString();
  return u.pathname === "/" && !u.search ? out.replace(/\/$/, "") : out;
}

export function isHttpUrl(input: string): boolean {
  try {
    const u = new URL(input);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

/** Guess the source type from a URL. */
export function detectSource(url: string): string {
  let host = "";
  try {
    host = new URL(url).hostname.toLowerCase();
  } catch {
    return "OTHER";
  }
  if (parseYouTubeId(url) || /(^|\.)youtube\.com$|(^|\.)youtu\.be$/.test(host)) return "YOUTUBE";
  if (/(^|\.)facebook\.com$|(^|\.)fb\.watch$|(^|\.)fb\.com$/.test(host)) return "FACEBOOK";
  if (/(^|\.)archive\.org$/.test(host)) return "INTERNET_ARCHIVE";
  if (/soundcloud\.com$|mixcloud\.com$/.test(host)) return "AUDIO_ARCHIVE";
  if (/vimeo\.com$|dailymotion\.com$/.test(host)) return "VIDEO_ARCHIVE";
  return "OTHER";
}

export function youTubeWatchUrl(id: string): string {
  return `https://www.youtube.com/watch?v=${id}`;
}

export function youTubeThumbnail(id: string, quality: "hq" | "mq" | "maxres" = "hq"): string {
  const file = quality === "maxres" ? "maxresdefault" : `${quality}default`;
  return `https://i.ytimg.com/vi/${id}/${file}.jpg`;
}

/** Internet Archive item identifier from an archive.org/details/<id> URL. */
export function parseArchiveOrgId(url: string): string | null {
  try {
    const u = new URL(url);
    if (!/(^|\.)archive\.org$/.test(u.hostname)) return null;
    const m = u.pathname.match(/^\/(?:details|embed)\/([^/?#]+)/);
    return m ? decodeURIComponent(m[1]) : null;
  } catch {
    return null;
  }
}

export type EmbedInfo =
  | { kind: "youtube"; videoId: string; src: string }
  | { kind: "archive"; src: string }
  | { kind: "none" };

/**
 * Official embed players only. Returns "none" when the source does not
 * support (or permit) embedding — the UI then shows "Open Original Source".
 */
export function resolveEmbed(rec: {
  youtubeVideoId?: string | null;
  sourceUrl: string;
  embeddable: boolean;
}): EmbedInfo {
  if (!rec.embeddable) return { kind: "none" };
  const yt = rec.youtubeVideoId || parseYouTubeId(rec.sourceUrl);
  if (isValidYouTubeId(yt)) {
    return {
      kind: "youtube",
      videoId: yt,
      src: `https://www.youtube-nocookie.com/embed/${yt}?rel=0&modestbranding=1&playsinline=1`,
    };
  }
  const ia = parseArchiveOrgId(rec.sourceUrl);
  if (ia) return { kind: "archive", src: `https://archive.org/embed/${encodeURIComponent(ia)}` };
  return { kind: "none" };
}
