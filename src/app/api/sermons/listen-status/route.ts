import { NextResponse } from "next/server";
import { resolveSermonAudioPlayback } from "@/lib/sermon-audio-playback-server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const videoId = new URL(request.url).searchParams.get("v")?.trim() ?? "";
  if (!/^[a-zA-Z0-9_-]{11}$/.test(videoId)) {
    return NextResponse.json({ error: "Invalid video id." }, { status: 400 });
  }

  const resolved = await resolveSermonAudioPlayback(videoId);
  return NextResponse.json({
    videoId,
    listenReady: Boolean(resolved),
    source: resolved?.kind === "direct" ? "hosted" : resolved?.kind === "proxy" ? "stream" : null,
  });
}
