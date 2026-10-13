import { NextResponse } from "next/server";
import { findCommunityStoryMusicTrack } from "@/lib/community-story-music";
import { resolveStoryMusicAudioStreamUrl } from "@/lib/community-story-music-playback-server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const trackId = (searchParams.get("trackId") ?? "").trim();
  if (!trackId) {
    return NextResponse.json({ error: "Missing trackId." }, { status: 400 });
  }

  const track = findCommunityStoryMusicTrack(trackId);
  if (!track) {
    return NextResponse.json({ error: "Unknown track." }, { status: 404 });
  }

  const startSeconds =
    typeof track.startSeconds === "number" && track.startSeconds >= 0
      ? Math.floor(track.startSeconds)
      : null;

  const youtubeVideoId = track.youtubeVideoId.trim();
  const basePayload = { youtubeVideoId, startSeconds };

  const hosted = track.audioUrl?.trim();
  if (hosted) {
    return NextResponse.json({
      mode: "audio" as const,
      audioUrl: hosted,
      ...basePayload,
    });
  }

  const origin = new URL(request.url).origin;
  const proxiedAudioUrl = `${origin}/api/community/story-music/stream?trackId=${encodeURIComponent(trackId)}`;

  const directAudio = await resolveStoryMusicAudioStreamUrl(youtubeVideoId);
  if (directAudio) {
    return NextResponse.json({
      mode: "audio" as const,
      audioUrl: proxiedAudioUrl,
      ...basePayload,
    });
  }

  return NextResponse.json({
    mode: "youtube" as const,
    ...basePayload,
  });
}
