import { NextResponse } from "next/server";
import { resolveSermonAudioPlayback } from "@/lib/sermon-audio-playback-server";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const videoId = new URL(request.url).searchParams.get("v")?.trim() ?? "";
  if (!/^[a-zA-Z0-9_-]{11}$/.test(videoId)) {
    return NextResponse.json({ error: "Invalid video id." }, { status: 400 });
  }

  const resolved = await resolveSermonAudioPlayback(videoId);
  if (resolved?.kind === "direct") {
    return NextResponse.json({
      mode: "audio" as const,
      youtubeVideoId: videoId,
      audioUrl: resolved.url,
      source: "hosted" as const,
    });
  }

  if (resolved?.kind === "proxy") {
    return NextResponse.json({
      mode: "audio" as const,
      youtubeVideoId: videoId,
      audioUrl: `/api/sermons/stream?v=${encodeURIComponent(videoId)}`,
      source: "stream" as const,
    });
  }

  return NextResponse.json({
    mode: "youtube" as const,
    youtubeVideoId: videoId,
  });
}
