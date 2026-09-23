import { NextResponse, type NextRequest } from "next/server";
import { requireAdminApi } from "@/lib/admin-api";
import { fetchUrlMetadata } from "@/lib/metadata";
import { isHttpUrl } from "@/lib/url";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const auth = await requireAdminApi(req);
  if (auth instanceof NextResponse) return auth;
  const url = req.nextUrl.searchParams.get("url")?.trim() ?? "";
  if (!isHttpUrl(url)) return NextResponse.json({ error: "Enter a valid http(s) URL" }, { status: 400 });
  try {
    return NextResponse.json(await fetchUrlMetadata(url));
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 502 });
  }
}
