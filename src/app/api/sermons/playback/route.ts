import { NextResponse } from "next/server";
import { resolveStoryMusicAudioStreamUrl } from "@/lib/community-story-music-playback-server";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const videoId = new URL(request.url).searchParams.get("v")?.trim() ?? "";
  if (!/^[a-zA-Z0-9_-]{11}$/.test(videoId)) {
    return NextResponse.json({ error: "Invalid video id." }, { status: 400 });
  }

  const directAudio = await resolveStoryMusicAudioStreamUrl(videoId);
  if (directAudio) {
    return NextResponse.json({
      mode: "audio" as const,
      youtubeVideoId: videoId,
      audioUrl: `/api/sermons/stream?v=${encodeURIComponent(videoId)}`,
    });
  }

  return NextResponse.json({
    mode: "youtube" as const,
    youtubeVideoId: videoId,
  });
}
