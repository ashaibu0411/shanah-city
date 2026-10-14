import { NextResponse } from "next/server";
import { resolveSermonStreamUpstream } from "@/lib/sermon-audio-playback-server";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const videoId = new URL(request.url).searchParams.get("v")?.trim() ?? "";
  if (!/^[a-zA-Z0-9_-]{11}$/.test(videoId)) {
    return NextResponse.json({ error: "Invalid video id." }, { status: 400 });
  }

  const upstream = await resolveSermonStreamUpstream(videoId);
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
