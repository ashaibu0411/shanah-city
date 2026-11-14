import { getYouTubeThumbnail } from "@/lib/streams";
import { getYouTubeVideoWatchUrl } from "@/lib/media-clips-utils";
import type { SermonVideo } from "@/lib/youtube-sermons-shared";
import { pickLatestEligibleSermon } from "@/lib/youtube-sermons-select";

/** Optional override when YouTube API/RSS is unavailable (set in Vercel env). */
export function homeSermonVideoIdOverride() {
  return process.env.NEXT_PUBLIC_HOME_SERMON_VIDEO_ID?.trim() || "";
}

export function buildHomeSermonFallback(): SermonVideo | null {
  const id = homeSermonVideoIdOverride();
  if (!id) return null;

  return {
    id,
    title: "Latest message",
    publishedAt: "",
    watchUrl: getYouTubeVideoWatchUrl(id),
    thumbnailUrl: getYouTubeThumbnail(id),
  };
}

/** Picks newest eligible sermon from the channel list, or env override only when the feed is empty. */
export function mergeHomeSermonVideo(
  primary: SermonVideo | null | undefined,
  candidates?: SermonVideo[],
): SermonVideo | null {
  const list = candidates?.length ? candidates : primary?.id ? [primary] : [];
  const picked = pickLatestEligibleSermon(list);
  if (picked) return picked;
  return buildHomeSermonFallback();
}

/** Sharper YouTube still for small home sermon thumbs (mqdefault ≈ 320×180). */
export function homeSermonInlineThumbnail(url: string): string {
  if (!url) return url;
  if (url.includes("img.youtube.com/vi/") && url.includes("/hqdefault.")) {
    return url.replace("/hqdefault.", "/mqdefault.");
  }
  if (url.includes("img.youtube.com/vi/") && url.includes("/default.")) {
    return url.replace("/default.", "/mqdefault.");
  }
  return url;
}
