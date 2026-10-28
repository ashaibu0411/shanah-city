import { get, put } from "@vercel/blob";
import {
  storyMusicEvidenceBlobOptions,
  STORY_MUSIC_EVIDENCE_BLOB_PREFIX,
} from "@/lib/story-music/story-music-blob";
import { encodeEvidenceBlobRef } from "@/lib/story-music/story-music-storage-ref";

export async function uploadStoryMusicEvidenceBlob(input: {
  rightsRecordId: string;
  filename: string;
  bytes: Buffer;
  contentType: string;
}) {
  const opts = storyMusicEvidenceBlobOptions();
  if (!opts) throw new Error("STORY_MUSIC_EVIDENCE_BLOB_READ_WRITE_TOKEN is not configured.");
  const safeName = input.filename.replace(/[^a-zA-Z0-9._-]/g, "-").slice(0, 80);
  const pathname = `${STORY_MUSIC_EVIDENCE_BLOB_PREFIX}${input.rightsRecordId}/${Date.now()}-${safeName}`;
  await put(pathname, input.bytes, {
    access: "private",
    contentType: input.contentType,
    token: opts.token,
    addRandomSuffix: false,
    ...(opts.storeId ? { storeId: opts.storeId } : {}),
  });
  return {
    storageRef: encodeEvidenceBlobRef(pathname),
    pathname,
    byteLength: input.bytes.length,
    contentType: input.contentType,
  };
}

export async function fetchStoryMusicEvidenceBlob(pathname: string): Promise<Response> {
  const opts = storyMusicEvidenceBlobOptions();
  if (!opts) throw new Error("Story music evidence blob not configured.");
  const result = await get(pathname, {
    access: "private",
    token: opts.token,
    ...(opts.storeId ? { storeId: opts.storeId } : {}),
  });
  if (!result || result.statusCode !== 200 || !result.stream) {
    throw new Error("Could not read evidence object.");
  }
  const headers = new Headers();
  if (result.blob.contentType) headers.set("Content-Type", result.blob.contentType);
  headers.set("Cache-Control", "private, no-store");
  return new Response(result.stream, { status: 200, headers });
}
