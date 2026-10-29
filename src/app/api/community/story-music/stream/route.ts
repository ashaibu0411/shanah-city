import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { findCommunityStoryMusicTrack } from "@/lib/community-story-music";
import { getUserFromSession, SESSION_COOKIE } from "@/lib/auth-server";
import { shouldUseHybridStoryMusicStream } from "@/lib/story-music/story-music-service";
import { viewerCanAccessStoryMusicTrack } from "@/lib/story-music/story-music-pilot-access";
import {
  streamHybridCatalogTrack,
  streamLocalWavFile,
} from "@/lib/story-music/story-music-stream-server";
import { resolveStoryMusicAudioStreamUrl } from "@/lib/community-story-music-playback-server";
import {
  isAllowedRemoteAudioUrl,
  resolveCatalogLocalPublicFile,
} from "@/lib/story-music/story-music-audio-security";
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
    limit: 300,
    windowSeconds: 60,
  });
  if (!rate.allowed) {
    return rateLimitResponse(rate.retryAfterSeconds);
  }

  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  const user = await getUserFromSession(token);
  const { useHybrid, track } = await shouldUseHybridStoryMusicStream(trackId, user);
  if (useHybrid && track) {
    if (!(await viewerCanAccessStoryMusicTrack(user, track))) {
      return NextResponse.json({ error: "Audio stream unavailable." }, { status: 403 });
    }
    return streamHybridCatalogTrack(track, request);
  }

  const legacyTrack = findCommunityStoryMusicTrack(trackId);
  if (!legacyTrack) {
    return NextResponse.json({ error: "Unknown track." }, { status: 404 });
  }

  const hosted = legacyTrack.audioUrl?.trim();
  if (hosted?.startsWith("https://") && isAllowedRemoteAudioUrl(hosted)) {
    return proxyLegacyRemoteAudio(hosted, request);
  }

  const localHosted = hosted ? resolveCatalogLocalPublicFile(hosted) : null;
  if (localHosted) {
    return streamLocalWavFile(localHosted, request, "private, max-age=300");
  }

  const upstream = await resolveStoryMusicAudioStreamUrl(legacyTrack.youtubeVideoId);
  if (!upstream) {
    return NextResponse.json({ error: "Audio stream unavailable." }, { status: 503 });
  }

  return proxyLegacyRemoteAudio(upstream, request);
}
