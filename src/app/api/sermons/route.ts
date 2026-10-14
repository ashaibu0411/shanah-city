import { NextResponse } from "next/server";
import { getChannelSermons } from "@/lib/youtube-sermons-server";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const limitRaw = Number(url.searchParams.get("limit") ?? "50");
  const limit = Number.isFinite(limitRaw) ? Math.min(Math.max(limitRaw, 1), 50) : 50;

  const videos = await getChannelSermons(limit);
  return NextResponse.json({ videos });
}
