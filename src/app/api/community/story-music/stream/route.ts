import { NextResponse } from "next/server";
import { findCommunityStoryMusicTrack } from "@/lib/community-story-music";
import { isStoryMusicHybridActive, findStoryMusicTrack } from "@/lib/story-music/story-music-service";
import { streamHybridCatalogTrack } from "@/lib/story-music/story-music-stream-server";
import { resolveStoryMusicAudioStreamUrl } from "@/lib/community-story-music-playback-server";
import {
  isAllowedRemoteAudioUrl,
  resolveCatalogLocalPublicFile,
} from "@/lib/story-music/story-music-audio-security";
import { createReadStream } from "fs";
import { Readable } from "stream";
import { enforceRateLimit, getClientIp, rateLimitResponse } from "@/lib/rate-limit-server";

export const runtime = "nodejs";

/** Legacy mode only — still used when hybrid flag is off (production default). */
async function proxyLegacyRemoteAudio(upstream: string, request: Request) {
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

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const trackId = (searchParams.get("trackId") ?? "").trim();
  if (!trackId) {
    return NextResponse.json({ error: "Missing trackId." }, { status: 400 });
  }

  const ip = getClientIp(request);
  const rate = await enforceRateLimit(`story-music-stream:${ip}`, {
    limit: 120,
    windowSeconds: 60,
  });
  if (!rate.allowed) {
    return rateLimitResponse(rate.retryAfterSeconds);
  }

  if (isStoryMusicHybridActive()) {
    const track = await findStoryMusicTrack(trackId);
    if (!track || track.playability !== "playable") {
      return NextResponse.json({ error: "Audio stream unavailable." }, { status: 503 });
    }
    return streamHybridCatalogTrack(track, request);
  }

  const track = findCommunityStoryMusicTrack(trackId);
  if (!track) {
    return NextResponse.json({ error: "Unknown track." }, { status: 404 });
  }

  const hosted = track.audioUrl?.trim();
  if (hosted?.startsWith("https://") && isAllowedRemoteAudioUrl(hosted)) {
    return proxyLegacyRemoteAudio(hosted, request);
  }

  const localHosted = hosted ? resolveCatalogLocalPublicFile(hosted) : null;
  if (localHosted) {
    const nodeStream = createReadStream(localHosted);
    const webStream = Readable.toWeb(nodeStream) as ReadableStream;
    const headers = new Headers();
    headers.set("Content-Type", "audio/wav");
    headers.set("Accept-Ranges", "bytes");
    return new Response(webStream, { status: 200, headers });
  }

  const upstream = await resolveStoryMusicAudioStreamUrl(track.youtubeVideoId);
  if (!upstream) {
    return NextResponse.json({ error: "Audio stream unavailable." }, { status: 503 });
  }

  return proxyLegacyRemoteAudio(upstream, request);
}
