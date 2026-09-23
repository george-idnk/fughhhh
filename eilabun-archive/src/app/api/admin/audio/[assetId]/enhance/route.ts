import { NextResponse, type NextRequest } from "next/server";
import { requireAdminApi } from "@/lib/admin-api";
import { enhanceOriginal, ffmpegAvailable, parseEnhanceSettings } from "@/lib/audio";

export const runtime = "nodejs";

export async function POST(req: NextRequest, { params }: { params: Promise<{ assetId: string }> }) {
  const auth = await requireAdminApi(req);
  if (auth instanceof NextResponse) return auth;
  if (!(await ffmpegAvailable())) {
    return NextResponse.json({ error: "ffmpeg is not installed on the server (FFMPEG_PATH)" }, { status: 503 });
  }
  const { assetId } = await params;
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  try {
    const asset = await enhanceOriginal(assetId, parseEnhanceSettings(body));
    return NextResponse.json({ id: asset.id, status: asset.status, error: asset.error });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}
