import { get, put } from "@vercel/blob";
import {
  isStoryMusicAudioBlobConfigured,
  storyMusicAudioBlobOptions,
  STORY_MUSIC_AUDIO_BLOB_PREFIX,
} from "@/lib/story-music/story-music-blob";
import { encodeAudioBlobRef } from "@/lib/story-music/story-music-storage-ref";

export async function uploadStoryMusicAudioBlob(input: {
  filename: string;
  bytes: Buffer;
  contentType: string;
}) {
  if (!isStoryMusicAudioBlobConfigured()) {
    throw new Error("STORY_MUSIC_BLOB_READ_WRITE_TOKEN is not configured.");
  }
  const safeName = input.filename.replace(/[^a-zA-Z0-9._-]/g, "-").slice(0, 80);
  const pathname = `${STORY_MUSIC_AUDIO_BLOB_PREFIX}${Date.now()}-${safeName}`;
  const opts = storyMusicAudioBlobOptions()!;
  await put(pathname, input.bytes, {
    access: "private",
    contentType: input.contentType,
    token: opts.token,
    addRandomSuffix: false,
    ...(opts.storeId ? { storeId: opts.storeId } : {}),
  });
  return {
    storageRef: encodeAudioBlobRef(pathname),
    pathname,
    byteLength: input.bytes.length,
    contentType: input.contentType,
  };
}

export async function fetchStoryMusicAudioBlob(pathname: string): Promise<Response> {
  const opts = storyMusicAudioBlobOptions();
  if (!opts) throw new Error("Story music blob not configured.");
  const result = await get(pathname, {
    access: "private",
    token: opts.token,
    ...(opts.storeId ? { storeId: opts.storeId } : {}),
  });
  if (!result || result.statusCode !== 200 || !result.stream) {
    throw new Error("Could not read audio object.");
  }
  const headers = new Headers();
  if (result.blob.contentType) headers.set("Content-Type", result.blob.contentType);
  return new Response(result.stream, { status: 200, headers });
}
