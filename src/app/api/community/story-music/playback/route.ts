import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getUserFromSession, SESSION_COOKIE } from "@/lib/auth-server";
import {
  findStoryMusicTrack,
  isStoryMusicHybridActiveForViewer,
  resolveStoryMusicPlayback,
} from "@/lib/story-music/story-music-service";
import { storyMusicPlaybackToApiResponse } from "@/lib/story-music/playback-response";
import { viewerCanAccessStoryMusicTrack } from "@/lib/story-music/story-music-pilot-access";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const trackId = (searchParams.get("trackId") ?? "").trim();
  if (!trackId) {
    return NextResponse.json({ error: "Missing trackId." }, { status: 400 });
  }

  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  const user = await getUserFromSession(token);
  const track = await findStoryMusicTrack(trackId, null, user);
  if (track && !(await viewerCanAccessStoryMusicTrack(user, track))) {
    return NextResponse.json({ error: "Track not available." }, { status: 403 });
  }

  const origin = new URL(request.url).origin;
  const plan = await resolveStoryMusicPlayback(trackId, origin, null, user);
  if (!plan) {
    return NextResponse.json({ error: "Unknown track." }, { status: 404 });
  }

  const hybridForViewer = await isStoryMusicHybridActiveForViewer(user);
  const body = storyMusicPlaybackToApiResponse(plan, hybridForViewer);
  if (body.mode === "unavailable") {
    return NextResponse.json(body, { status: 200 });
  }

  return NextResponse.json(body);
}
