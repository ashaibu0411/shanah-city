import { get } from "@vercel/blob";
import { communityBlobRequestOptions } from "@/lib/community-blob";

async function getCommunityBlobObject(pathname: string, access: "public" | "private") {
  const opts = communityBlobRequestOptions();
  if (!opts) throw new Error("Community blob storage is not configured.");
  return get(pathname, {
    access,
    token: opts.token,
    ...(opts.storeId ? { storeId: opts.storeId } : {}),
  });
}

/** Stream a community media object (supports private store uploads). */
export async function fetchCommunityMediaBlob(pathname: string): Promise<Response> {
  let result = await getCommunityBlobObject(pathname, "private");
  if (!result || result.statusCode !== 200 || !result.stream) {
    result = await getCommunityBlobObject(pathname, "public");
  }
  if (!result || result.statusCode !== 200 || !result.stream) {
    throw new Error("Could not read community media object.");
  }
  const headers = new Headers();
  if (result.blob.contentType) headers.set("Content-Type", result.blob.contentType);
  headers.set("Accept-Ranges", "bytes");
  headers.set("Cache-Control", "private, max-age=300");
  return new Response(result.stream, { status: 200, headers });
}
