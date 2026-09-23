import { NextResponse, type NextRequest } from "next/server";
import { requireAdminApi } from "@/lib/admin-api";
import { findDuplicate } from "@/lib/recordings";
import { isHttpUrl, parseYouTubeId } from "@/lib/url";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const auth = await requireAdminApi(req);
  if (auth instanceof NextResponse) return auth;
  const sp = req.nextUrl.searchParams;
  const url = sp.get("url") ?? "";
  const videoId = sp.get("videoId") || parseYouTubeId(url);
  const dup = await findDuplicate({
    youtubeVideoId: videoId,
    sourceUrl: isHttpUrl(url) ? url : null,
    excludeId: sp.get("excludeId") ?? undefined,
  });
  return NextResponse.json({ duplicate: dup ? { id: dup.id, title: dup.title } : null });
}
