import "server-only";
import { decodeEntities, parseIsoDuration } from "./format";
import { youTubeWatchUrl } from "./url";

// Official YouTube Data API v3 client (read-only, API-key auth).
// Quota: search.list costs 100 units, videos.list costs 1 unit per call.

const API = "https://www.googleapis.com/youtube/v3";

export function youTubeApiKey(): string | null {
  const k = process.env.YOUTUBE_API_KEY?.trim();
  return k ? k : null;
}

export interface YouTubeResult {
  videoId: string;
  title: string;
  description: string;
  channelTitle: string;
  channelId: string;
  channelUrl: string;
  publishedAt: string | null;
  thumbnailUrl: string | null;
  url: string;
  duration: number | null;
  embeddable: boolean;
  privacyStatus: string | null;
  liveBroadcastContent: string | null;
}

export class YouTubeApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
  }
}

async function call<T>(path: string, params: Record<string, string>): Promise<T> {
  const key = youTubeApiKey();
  if (!key) throw new YouTubeApiError("YOUTUBE_API_KEY is not configured", 503);
  const url = new URL(`${API}/${path}`);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  url.searchParams.set("key", key);
  const res = await fetch(url, { cache: "no-store", signal: AbortSignal.timeout(15000) });
  if (!res.ok) {
    let msg = `YouTube API error ${res.status}`;
    try {
      const body = (await res.json()) as { error?: { message?: string } };
      if (body.error?.message) msg = body.error.message.replace(/<[^>]+>/g, "");
    } catch {
      /* ignore */
    }
    throw new YouTubeApiError(msg, res.status);
  }
  return (await res.json()) as T;
}

interface Thumbs {
  maxres?: { url: string };
  standard?: { url: string };
  high?: { url: string };
  medium?: { url: string };
  default?: { url: string };
}
interface VideoResource {
  id: string;
  snippet?: {
    title: string;
    description: string;
    channelTitle: string;
    channelId: string;
    publishedAt: string;
    thumbnails?: Thumbs;
    liveBroadcastContent?: string;
  };
  contentDetails?: { duration?: string };
  status?: { embeddable?: boolean; privacyStatus?: string };
}

function bestThumb(t?: Thumbs): string | null {
  return t?.maxres?.url ?? t?.standard?.url ?? t?.high?.url ?? t?.medium?.url ?? t?.default?.url ?? null;
}

/** Full details (duration, embeddable status) for up to 50 ids. */
export async function getVideos(ids: string[]): Promise<YouTubeResult[]> {
  if (!ids.length) return [];
  const data = await call<{ items: VideoResource[] }>("videos", {
    part: "snippet,contentDetails,status",
    id: ids.slice(0, 50).join(","),
    maxResults: "50",
  });
  const byId = new Map(data.items.map((v) => [v.id, v]));
  return ids
    .map((id) => byId.get(id))
    .filter((v): v is VideoResource => !!v && !!v.snippet)
    .map((v) => ({
      videoId: v.id,
      title: decodeEntities(v.snippet!.title),
      description: v.snippet!.description ?? "",
      channelTitle: decodeEntities(v.snippet!.channelTitle ?? ""),
      channelId: v.snippet!.channelId,
      channelUrl: `https://www.youtube.com/channel/${v.snippet!.channelId}`,
      publishedAt: v.snippet!.publishedAt ?? null,
      thumbnailUrl: bestThumb(v.snippet!.thumbnails),
      url: youTubeWatchUrl(v.id),
      duration: parseIsoDuration(v.contentDetails?.duration),
      embeddable: v.status?.embeddable !== false,
      privacyStatus: v.status?.privacyStatus ?? null,
      liveBroadcastContent: v.snippet!.liveBroadcastContent ?? null,
    }));
}

export interface YouTubeSearchPage {
  results: YouTubeResult[];
  nextPageToken: string | null;
  totalResults: number | null;
}

/** Search public videos. Only public, listed results are returned by the API. */
export async function searchYouTube(
  q: string,
  opts: { pageToken?: string; order?: "relevance" | "date" | "viewCount"; maxResults?: number } = {},
): Promise<YouTubeSearchPage> {
  const params: Record<string, string> = {
    part: "snippet",
    type: "video",
    q,
    maxResults: String(Math.min(opts.maxResults ?? 25, 50)),
    order: opts.order ?? "relevance",
    safeSearch: "none",
  };
  if (opts.pageToken) params.pageToken = opts.pageToken;
  const data = await call<{
    items: { id: { videoId?: string } }[];
    nextPageToken?: string;
    pageInfo?: { totalResults?: number };
  }>("search", params);
  const ids = data.items.map((i) => i.id.videoId).filter((x): x is string => !!x);
  const results = await getVideos(ids);
  return {
    results,
    nextPageToken: data.nextPageToken ?? null,
    totalResults: data.pageInfo?.totalResults ?? null,
  };
}
