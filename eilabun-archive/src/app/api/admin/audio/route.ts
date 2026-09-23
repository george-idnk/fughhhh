import { NextResponse, type NextRequest } from "next/server";
import { requireAdminApi } from "@/lib/admin-api";
import { saveOriginal } from "@/lib/audio";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const auth = await requireAdminApi(req);
  if (auth instanceof NextResponse) return auth;

  const maxMb = Number(process.env.MAX_UPLOAD_MB) || 300;
  const len = Number(req.headers.get("content-length") ?? 0);
  if (len > maxMb * 1024 * 1024) {
    return NextResponse.json({ error: `File too large (max ${maxMb} MB)` }, { status: 413 });
  }
  const fd = await req.formData();
  const recordingId = String(fd.get("recordingId") ?? "");
  const rightsStatement = String(fd.get("rightsStatement") ?? "").trim();
  const file = fd.get("file");
  if (fd.get("confirm") !== "on") {
    return NextResponse.json({ error: "You must confirm you own or have permission for this recording" }, { status: 400 });
  }
  if (rightsStatement.length < 5) return NextResponse.json({ error: "A rights statement is required" }, { status: 400 });
  if (!(file instanceof File) || file.size === 0) return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
  if (file.size > maxMb * 1024 * 1024) {
    return NextResponse.json({ error: `File too large (max ${maxMb} MB)` }, { status: 413 });
  }
  const rec = await prisma.recording.findUnique({ where: { id: recordingId }, select: { isAuthorized: true } });
  if (!rec) return NextResponse.json({ error: "Recording not found" }, { status: 404 });
  if (!rec.isAuthorized) {
    return NextResponse.json(
      { error: "Mark the recording as “Original / authorized audio” and save it before uploading" },
      { status: 400 },
    );
  }
  try {
    const asset = await saveOriginal({
      recordingId,
      data: new Uint8Array(await file.arrayBuffer()),
      originalName: file.name,
      rightsStatement,
    });
    return NextResponse.json({ id: asset.id });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}
