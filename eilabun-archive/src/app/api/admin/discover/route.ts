import { NextResponse, type NextRequest } from "next/server";
import { requireAdminApi } from "@/lib/admin-api";
import { searchInternetArchive } from "@/lib/metadata";
import { existingIdsFor } from "@/lib/recordings";
import { searchYouTube, youTubeApiKey, YouTubeApiError } from "@/lib/youtube";

export const dynamic = "force-dynamic";

// Review-only discovery: results are returned to the admin, never auto-inserted.
export async function GET(req: NextRequest) {
  const auth = await requireAdminApi(req);
  if (auth instanceof NextResponse) return auth;
  const sp = req.nextUrl.searchParams;
  const q = (sp.get("q") ?? "").trim().slice(0, 200);
  const provider = sp.get("provider") === "archive" ? "archive" : "youtube";
  if (!q) return NextResponse.json({ error: "Enter a search query" }, { status: 400 });

  try {
    if (provider === "archive") {
      const results = await searchInternetArchive(q);
      const existing = await existingIdsFor([], results.map((r) => r.url));
      return NextResponse.json({
        provider,
        results: results.map((r) => ({ ...r, existingId: existing.get(`https://archive.org/details/${r.identifier}`) ?? null })),
      });
    }
    if (!youTubeApiKey()) {
      return NextResponse.json(
        { error: "Automatic YouTube discovery requires YOUTUBE_API_KEY in .env (see README).", needsKey: true },
        { status: 503 },
      );
    }
    const order = (["relevance", "date", "viewCount"] as const).find((o) => o === sp.get("order")) ?? "relevance";
    const page = await searchYouTube(q, { pageToken: sp.get("pageToken") ?? undefined, order });
    const existing = await existingIdsFor(page.results.map((r) => r.videoId), []);
    return NextResponse.json({
      provider,
      nextPageToken: page.nextPageToken,
      totalResults: page.totalResults,
      results: page.results.map((r) => ({ ...r, existingId: existing.get(r.videoId) ?? null })),
    });
  } catch (e) {
    const status = e instanceof YouTubeApiError ? (e.status === 403 ? 403 : 502) : 502;
    return NextResponse.json({ error: (e as Error).message }, { status });
  }
}
