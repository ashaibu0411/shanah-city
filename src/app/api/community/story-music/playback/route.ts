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

  const hosted = track.audioUrl?.trim();
  if (hosted) {
    return NextResponse.json({
      audioUrl: hosted,
      startSeconds: track.startSeconds ?? null,
    });
  }

  const audioUrl = await resolveStoryMusicAudioStreamUrl(track.youtubeVideoId);
  if (!audioUrl) {
    return NextResponse.json(
      { error: "Could not load audio for this song. Try another track." },
      { status: 503 },
    );
  }

  return NextResponse.json({
    audioUrl,
    startSeconds: track.startSeconds ?? null,
  });
}
