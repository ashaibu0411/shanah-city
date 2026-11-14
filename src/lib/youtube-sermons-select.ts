import type { SermonVideo } from "@/lib/youtube-sermons-shared";

/** Trailers, Shorts hashtags, and similar non-message uploads. */
export function isExcludedSermonTitle(title: string): boolean {
  const t = title.trim();
  if (!t) return true;
  if (/^#?\s*shorts?\b/i.test(t)) return true;
  if (/\b(trailer|teaser|promo)\b/i.test(t)) return true;
  return false;
}

export function hasVerifiedPublicationDate(publishedAt: string): boolean {
  const ms = Date.parse(publishedAt);
  return Number.isFinite(ms);
}

export function sermonPublishedAtMs(publishedAt: string): number {
  const ms = Date.parse(publishedAt);
  return Number.isFinite(ms) ? ms : Number.NEGATIVE_INFINITY;
}

/** Newest first; videos without a verified timestamp sort after dated entries. */
export function sortSermonsNewestFirst(videos: SermonVideo[]): SermonVideo[] {
  return [...videos].sort((a, b) => {
    const tb = sermonPublishedAtMs(b.publishedAt);
    const ta = sermonPublishedAtMs(a.publishedAt);
    if (tb !== ta) return tb - ta;
    return a.id.localeCompare(b.id);
  });
}

export function filterEligibleSermonVideos(videos: SermonVideo[]): SermonVideo[] {
  return videos.filter((video) => {
    if (!video.id?.trim() || !video.title?.trim()) return false;
    return !isExcludedSermonTitle(video.title);
  });
}

/**
 * Prefer the newest upload with a verified publication time.
 * Falls back to the newest titled entry only when no dated sermons exist.
 */
export function pickLatestEligibleSermon(videos: SermonVideo[]): SermonVideo | null {
  const sorted = sortSermonsNewestFirst(filterEligibleSermonVideos(videos));
  const withDate = sorted.filter((v) => hasVerifiedPublicationDate(v.publishedAt));
  if (withDate.length > 0) return withDate[0] ?? null;
  return sorted[0] ?? null;
}

export function normalizeChannelSermonList(videos: SermonVideo[]): SermonVideo[] {
  return sortSermonsNewestFirst(filterEligibleSermonVideos(videos));
}