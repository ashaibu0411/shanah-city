import { closeSync, createReadStream, openSync, readSync, statSync } from "fs";
import { Readable } from "stream";
import { NextResponse } from "next/server";
import type { StoryMusicTrackRecord } from "@/lib/story-music/types";
import { fetchStoryMusicAudioBlob } from "@/lib/story-music/story-music-audio-server";
import {
  decodeBlobPathname,
  decodeTestFixtureRelativePath,
  STORY_MUSIC_BLOB_REF_SCHEME,
  STORY_MUSIC_TEST_REF_SCHEME,
} from "@/lib/story-music/story-music-storage-ref";
import {
  resolveCatalogLocalPublicFile,
  resolveStoryMusicTestFixtureFile,
} from "@/lib/story-music/story-music-audio-security";

function streamHeaders(contentType: string, cache = "private, no-store") {
  const headers = new Headers();
  headers.set("Content-Type", contentType);
  headers.set("Accept-Ranges", "bytes");
  headers.set("Cache-Control", cache);
  return headers;
}

/** Local WAV streaming with HTTP Range support (WebView / mobile players). */
export function streamLocalWavFile(
  localPath: string,
  request: Request,
  cache = "private, no-store",
): Response {
  const size = statSync(localPath).size;
  const rangeHeader = request.headers.get("range")?.trim();

  if (rangeHeader) {
    const match = /^bytes=(\d*)-(\d*)$/i.exec(rangeHeader);
    if (match) {
      const start = match[1] ? parseInt(match[1], 10) : 0;
      const end = match[2] !== "" ? parseInt(match[2], 10) : size - 1;
      if (Number.isNaN(start) || Number.isNaN(end) || start >= size || start > end) {
        return new Response(null, {
          status: 416,
          headers: { "Content-Range": `bytes */${size}` },
        });
      }
      const endClamped = Math.min(end, size - 1);
      const length = endClamped - start + 1;
      const fd = openSync(localPath, "r");
      try {
        const chunk = Buffer.alloc(length);
        readSync(fd, chunk, 0, length, start);
        const headers = streamHeaders("audio/wav", cache);
        headers.set("Content-Range", `bytes ${start}-${endClamped}/${size}`);
        headers.set("Content-Length", String(length));
        return new Response(chunk, { status: 206, headers });
      } finally {
        closeSync(fd);
      }
    }
  }

  const headers = streamHeaders("audio/wav", cache);
  headers.set("Content-Length", String(size));
  const nodeStream = createReadStream(localPath);
  const webStream = Readable.toWeb(nodeStream) as ReadableStream;
  return new Response(webStream, { status: 200, headers });
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
    const fixtureRel = decodeTestFixtureRelativePath(ref);
    if (!fixtureRel) return NextResponse.json({ error: "Invalid test audio ref." }, { status: 403 });
    const localPath = resolveStoryMusicTestFixtureFile(fixtureRel);
    if (!localPath) return NextResponse.json({ error: "Test audio missing." }, { status: 503 });
    return streamLocalWavFile(localPath, request);
  }

  if (ref.startsWith("/")) {
    const localPath = resolveCatalogLocalPublicFile(ref);
    if (!localPath) {
      return NextResponse.json({ error: "Authorized audio path not allowed." }, { status: 403 });
    }
    return streamLocalWavFile(localPath, request, "private, max-age=300");
  }

  return NextResponse.json({ error: "Unsupported audio reference." }, { status: 403 });
}
