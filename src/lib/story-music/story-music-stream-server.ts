import { createReadStream } from "fs";
import { Readable } from "stream";
import { NextResponse } from "next/server";
import type { StoryMusicTrackRecord } from "@/lib/story-music/types";
import { fetchStoryMusicAudioBlob } from "@/lib/story-music/story-music-audio-server";
import {
  decodeBlobPathname,
  decodeTestPublicPath,
  STORY_MUSIC_BLOB_REF_SCHEME,
  STORY_MUSIC_TEST_REF_SCHEME,
} from "@/lib/story-music/story-music-storage-ref";
import { resolveCatalogLocalPublicFile } from "@/lib/story-music/story-music-audio-security";

function streamHeaders(contentType: string, cache = "private, no-store") {
  const headers = new Headers();
  headers.set("Content-Type", contentType);
  headers.set("Accept-Ranges", "bytes");
  headers.set("Cache-Control", cache);
  return headers;
}

export async function streamHybridCatalogTrack(track: StoryMusicTrackRecord, request: Request) {
  const ref = track.audioPath?.trim();
  if (!ref) {
    return NextResponse.json({ error: "Audio stream unavailable." }, { status: 503 });
  }

  if (ref.startsWith(STORY_MUSIC_BLOB_REF_SCHEME)) {
    const pathname = decodeBlobPathname(ref);
    if (!pathname) return NextResponse.json({ error: "Invalid audio reference." }, { status: 403 });
    try {
      const blobResponse = await fetchStoryMusicAudioBlob(pathname);
      const headers = new Headers(blobResponse.headers);
      headers.set("Cache-Control", "private, no-store");
      headers.set("Accept-Ranges", "bytes");
      return new Response(blobResponse.body, { status: blobResponse.status, headers });
    } catch {
      return NextResponse.json({ error: "Could not stream audio." }, { status: 502 });
    }
  }

  if (ref.startsWith(STORY_MUSIC_TEST_REF_SCHEME)) {
    const publicPath = decodeTestPublicPath(ref);
    if (!publicPath) return NextResponse.json({ error: "Invalid test audio ref." }, { status: 403 });
    const localPath = resolveCatalogLocalPublicFile(publicPath);
    if (!localPath) return NextResponse.json({ error: "Test audio missing." }, { status: 503 });
    const nodeStream = createReadStream(localPath);
    const webStream = Readable.toWeb(nodeStream) as ReadableStream;
    return new Response(webStream, { status: 200, headers: streamHeaders("audio/wav") });
  }

  if (ref.startsWith("/")) {
    const localPath = resolveCatalogLocalPublicFile(ref);
    if (!localPath) {
      return NextResponse.json({ error: "Authorized audio path not allowed." }, { status: 403 });
    }
    const nodeStream = createReadStream(localPath);
    const webStream = Readable.toWeb(nodeStream) as ReadableStream;
    return new Response(webStream, { status: 200, headers: streamHeaders("audio/wav", "private, max-age=300") });
  }

  return NextResponse.json({ error: "Unsupported audio reference." }, { status: 403 });
}
