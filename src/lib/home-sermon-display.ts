import { latestSermon } from "@/lib/site";
import { getYouTubeThumbnail } from "@/lib/streams";
import { getYouTubeVideoWatchUrl } from "@/lib/media-clips-utils";
import type { SermonVideo } from "@/lib/youtube-sermons-shared";

/** Optional override when YouTube API/RSS is unavailable (set in Vercel env). */
export function homeSermonVideoIdOverride() {
  return process.env.NEXT_PUBLIC_HOME_SERMON_VIDEO_ID?.trim() || "";
}

export function buildHomeSermonFallback(): SermonVideo | null {
  const id = homeSermonVideoIdOverride();
  if (!id) return null;

  return {
    id,
    title: latestSermon.title,
    publishedAt: new Date().toISOString(),
    watchUrl: getYouTubeVideoWatchUrl(id),
    thumbnailUrl: getYouTubeThumbnail(id),
  };
}

export function mergeHomeSermonVideo(primary: SermonVideo | null | undefined): SermonVideo | null {
  if (primary?.id) return primary;
  return buildHomeSermonFallback();
}
