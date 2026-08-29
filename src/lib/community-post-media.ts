import { isAllowedCommunityMediaUrl } from "@/lib/community-media-shared";
import type { CommunityPost, CommunityPostMediaItem } from "@/lib/member-types";

export const COMMUNITY_POST_MAX_MEDIA = 10;

function isMediaItem(value: unknown): value is CommunityPostMediaItem {
  if (!value || typeof value !== "object") return false;
  const item = value as Record<string, unknown>;
  return (
    typeof item.url === "string" &&
    (item.type === "image" || item.type === "video") &&
    isAllowedCommunityMediaUrl(item.url)
  );
}

export function parseCommunityPostMediaItems(raw: unknown): CommunityPostMediaItem[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter(isMediaItem).slice(0, COMMUNITY_POST_MAX_MEDIA);
}

export function communityPostMediaItems(post: {
  mediaItems?: CommunityPostMediaItem[];
  mediaUrl?: string;
  mediaType?: CommunityPost["mediaType"];
}): CommunityPostMediaItem[] {
  if (post.mediaItems?.length) {
    return post.mediaItems;
  }
  if (post.mediaUrl && post.mediaType) {
    return [{ url: post.mediaUrl, type: post.mediaType }];
  }
  return [];
}

export function communityPostHasMedia(post: {
  mediaItems?: CommunityPostMediaItem[];
  mediaUrl?: string;
  mediaType?: CommunityPost["mediaType"];
}) {
  return communityPostMediaItems(post).length > 0;
}

export function normalizeStoredCommunityPostMedia(
  items: CommunityPostMediaItem[],
): {
  mediaItems: CommunityPostMediaItem[] | null;
  mediaUrl: string | null;
  mediaType: string | null;
} {
  if (items.length === 0) {
    return { mediaItems: null, mediaUrl: null, mediaType: null };
  }
  const first = items[0];
  return {
    mediaItems: items,
    mediaUrl: first.url,
    mediaType: first.type,
  };
}

export function communityPostMediaSummary(items: CommunityPostMediaItem[]) {
  if (items.length === 0) return "";
  if (items.length === 1) {
    return items[0].type === "video" ? "Shared a video" : "Shared a photo";
  }
  const images = items.filter((item) => item.type === "image").length;
  const videos = items.filter((item) => item.type === "video").length;
  if (images && videos) {
    return `Shared ${items.length} photos and videos`;
  }
  if (videos) {
    return `Shared ${videos} videos`;
  }
  return `Shared ${images} photos`;
}

export function parseCommunityPostMediaInput(body: Record<string, unknown>): CommunityPostMediaItem[] {
  const fromArray = parseCommunityPostMediaItems(body.mediaItems);
  if (fromArray.length > 0) {
    return fromArray;
  }

  const mediaUrl = body.mediaUrl ? String(body.mediaUrl).trim() : "";
  const mediaType =
    body.mediaType === "video" ? "video" : body.mediaType === "image" ? "image" : null;
  if (mediaUrl && mediaType && isAllowedCommunityMediaUrl(mediaUrl)) {
    return [{ url: mediaUrl, type: mediaType }];
  }

  return [];
}
