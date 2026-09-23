import { NextResponse, type NextRequest } from "next/server";
import { requireAdminApi } from "@/lib/admin-api";
import { deleteAsset } from "@/lib/audio";

export const runtime = "nodejs";

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ assetId: string }> }) {
  const auth = await requireAdminApi(req);
  if (auth instanceof NextResponse) return auth;
  const { assetId } = await params;
  await deleteAsset(assetId);
  return NextResponse.json({ ok: true });
}
