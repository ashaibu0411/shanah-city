import { createReadStream } from "fs";
import { Readable } from "stream";
import { NextResponse } from "next/server";
import type { StoryMusicTrackRecord } from "@/lib/story-music/types";
import {
  isAllowedRemoteAudioUrl,
  resolveCatalogLocalPublicFile,
} from "@/lib/story-music/story-music-audio-security";

async function proxyAllowlistedRemoteAudio(upstream: string, request: Request) {
  if (!isAllowedRemoteAudioUrl(upstream)) {
    return NextResponse.json({ error: "Remote audio host not allowed." }, { status: 403 });
  }

  const range = request.headers.get("range");
  const upstreamResponse = await fetch(upstream, {
    headers: range ? { Range: range } : undefined,
    redirect: "error",
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

export async function streamHybridCatalogTrack(track: StoryMusicTrackRecord, request: Request) {
  const hosted = track.audioPath?.trim();
  if (!hosted) {
    return NextResponse.json({ error: "Audio stream unavailable." }, { status: 503 });
  }

  if (hosted.startsWith("http://") || hosted.startsWith("https://")) {
    return proxyAllowlistedRemoteAudio(hosted, request);
  }

  const localPath = resolveCatalogLocalPublicFile(hosted);
  if (!localPath) {
    return NextResponse.json({ error: "Authorized audio path not allowed." }, { status: 403 });
  }

  const nodeStream = createReadStream(localPath);
  const webStream = Readable.toWeb(nodeStream) as ReadableStream;
  const headers = new Headers();
  headers.set("Content-Type", "audio/wav");
  headers.set("Accept-Ranges", "bytes");
  headers.set("Cache-Control", "public, max-age=3600");
  return new Response(webStream, { status: 200, headers });
}
