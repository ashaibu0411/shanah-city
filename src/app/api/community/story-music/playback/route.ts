import { NextResponse } from "next/server";
import { resolveStoryMusicPlayback } from "@/lib/story-music/story-music-service";
import { storyMusicPlaybackToApiResponse } from "@/lib/story-music/playback-response";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const trackId = (searchParams.get("trackId") ?? "").trim();
  if (!trackId) {
    return NextResponse.json({ error: "Missing trackId." }, { status: 400 });
  }

  const origin = new URL(request.url).origin;
  const plan = await resolveStoryMusicPlayback(trackId, origin);
  if (!plan) {
    return NextResponse.json({ error: "Unknown track." }, { status: 404 });
  }

  const body = storyMusicPlaybackToApiResponse(plan);
  if (body.mode === "unavailable") {
    return NextResponse.json(body, { status: 200 });
  }

  return NextResponse.json(body);
}
