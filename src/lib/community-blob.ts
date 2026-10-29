/**
 * Community moments media (photos, videos, story audio) — separate from Marriage Prep private Blob.
 * Uses COMMUNITY_BLOB_* when set; otherwise falls back to project BLOB_READ_WRITE_TOKEN / BLOB_STORE_ID.
 */

export const COMMUNITY_BLOB_PATH_PREFIX = "community/";

export function getCommunityBlobReadWriteToken(): string | null {
  const dedicated = process.env.COMMUNITY_BLOB_READ_WRITE_TOKEN?.trim();
  if (dedicated) return dedicated;
  return process.env.BLOB_READ_WRITE_TOKEN?.trim() || null;
}

/** Pin uploads to the public community store when the project default BLOB_STORE_ID targets another store. */
export function getCommunityBlobStoreId(): string | null {
  const dedicated = process.env.COMMUNITY_BLOB_STORE_ID?.trim();
  if (dedicated) return dedicated;
  return process.env.BLOB_STORE_ID?.trim() || null;
}

export function isCommunityBlobConfigured(): boolean {
  return getCommunityBlobReadWriteToken() !== null;
}

export type CommunityBlobAccess = "public" | "private";

export function communityBlobAccessMode(): CommunityBlobAccess {
  const raw = process.env.COMMUNITY_BLOB_ACCESS?.trim().toLowerCase();
  if (raw === "private" || raw === "public") return raw;
  return "public";
}

export function communityBlobRequestOptions(): { token: string; storeId?: string } | null {
  const token = getCommunityBlobReadWriteToken();
  if (!token) return null;
  const storeId = getCommunityBlobStoreId();
  return storeId ? { token, storeId } : { token };
}

export function isPrivateStorePublicAccessError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return /cannot use public access on a private store/i.test(message);
}

export function communityMediaStreamPath(pathname: string): string {
  return `/api/community/media/stream?pathname=${encodeURIComponent(pathname)}`;
}

export function isAllowedCommunityStreamPathname(pathname: string): boolean {
  const clean = pathname.trim().replace(/^\/+/, "");
  if (!clean.startsWith(COMMUNITY_BLOB_PATH_PREFIX)) return false;
  const rest = clean.slice(COMMUNITY_BLOB_PATH_PREFIX.length);
  return (
    rest.startsWith("images/") ||
    rest.startsWith("videos/") ||
    rest.startsWith("audio/")
  );
}

export function parseCommunityMediaStreamPathname(mediaUrl: string): string | null {
  const trimmed = mediaUrl.trim();
  if (!trimmed.includes("/api/community/media/stream")) return null;
  try {
    const parsed = new URL(trimmed, "https://local.invalid");
    const pathname = parsed.searchParams.get("pathname")?.trim();
    if (!pathname || !isAllowedCommunityStreamPathname(pathname)) return null;
    return pathname.replace(/^\/+/, "");
  } catch {
    return null;
  }
}

export function shouldServeCommunityMediaViaStream(blobUrl: string): boolean {
  if (communityBlobAccessMode() === "private") return true;
  try {
    const host = new URL(blobUrl).hostname;
    return !host.endsWith(".public.blob.vercel-storage.com");
  } catch {
    return false;
  }
}

export function normalizeCommunityUploadedMediaUrl(
  pathname: string,
  blobUrl: string,
  accessUsed?: CommunityBlobAccess,
): string {
  if (accessUsed === "private" || shouldServeCommunityMediaViaStream(blobUrl)) {
    return communityMediaStreamPath(pathname);
  }
  return blobUrl;
}
