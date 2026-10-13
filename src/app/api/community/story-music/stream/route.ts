import { NextResponse } from "next/server";
import { findCommunityStoryMusicTrack } from "@/lib/community-story-music";
import { resolveStoryMusicAudioStreamUrl } from "@/lib/community-story-music-playback-server";

export const runtime = "nodejs";

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

  const upstream =
    track.audioUrl?.trim() || (await resolveStoryMusicAudioStreamUrl(track.youtubeVideoId));
  if (!upstream) {
    return NextResponse.json({ error: "Audio stream unavailable." }, { status: 503 });
  }

  const range = request.headers.get("range");
  const upstreamResponse = await fetch(upstream, {
    headers: range ? { Range: range } : undefined,
    redirect: "follow",
  });

  if (!upstreamResponse.ok || !upstreamResponse.body) {
    return NextResponse.json({ error: "Could not fetch audio stream." }, { status: 502 });
  }

  const headers = new Headers();
  const contentType = upstreamResponse.headers.get("content-type");
  if (contentType) headers.set("Content-Type", contentType);
  const contentLength = upstreamResponse.headers.get("content-length");
  if (contentLength) headers.set("Content-Length", contentLength);
  const contentRange = upstreamResponse.headers.get("content-range");
  if (contentRange) headers.set("Content-Range", contentRange);
  headers.set("Accept-Ranges", "bytes");
  headers.set("Cache-Control", "private, max-age=300");

  return new Response(upstreamResponse.body, {
    status: upstreamResponse.status,
    headers,
  });
}
