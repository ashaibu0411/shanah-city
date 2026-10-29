import { isCommunityBlobConfigured } from "@/lib/community-blob";

/** True when server can read/write Vercel Blob for community media. */
export function isBlobConfigured() {
  return isCommunityBlobConfigured();
}

export function useBlobStorage() {
  return isCommunityBlobConfigured();
}
