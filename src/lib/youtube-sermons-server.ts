import { unstable_cache } from "next/cache";
import { liveVideoConfig } from "@/lib/live-config";
import { getYouTubeVideoWatchUrl } from "@/lib/media-clips-utils";
import { getYouTubeThumbnail } from "@/lib/streams";
import { site } from "@/lib/site";

export type SermonVideo = {
  id: string;
  title: string;
  publishedAt: string;
  watchUrl: string;
  thumbnailUrl: string;
};

const DEFAULT_CHANNEL_ID = "UC4q0d9NgxRREu8kr1kUMDxw";

export function getShanahCityYouTubeChannelId() {
  return liveVideoConfig.youtubeChannelId.trim() || DEFAULT_CHANNEL_ID;
}

export function getShanahCityYouTubeChannelUrl() {
  return site.social.youtube;
}

function parseYouTubeChannelFeed(xml: string): SermonVideo[] {
  const entries = xml.split("<entry>").slice(1);

  return entries
    .map((entry) => {
      const id = entry.match(/<yt:videoId>([^<]+)<\/yt:videoId>/)?.[1]?.trim();
      const title = entry.match(/<title>([^<]+)<\/title>/)?.[1]?.trim();
      const publishedAt = entry.match(/<published>([^<]+)<\/published>/)?.[1]?.trim();
      if (!id || !title || !publishedAt) return null;

      return {
        id,
        title,
        publishedAt,
        watchUrl: getYouTubeVideoWatchUrl(id),
        thumbnailUrl: getYouTubeThumbnail(id),
      };
    })
    .filter((video): video is SermonVideo => Boolean(video));
}

async function loadChannelSermons(limit = 24): Promise<SermonVideo[]> {
  const channelId = getShanahCityYouTubeChannelId();
  const feedUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=${encodeURIComponent(channelId)}`;

  try {
    const response = await fetch(feedUrl, {
      headers: {
        "User-Agent": "ShanahCityApp/1.0 (+https://shanah-city.vercel.app)",
        Accept: "application/atom+xml, application/xml, text/xml;q=0.9, */*;q=0.8",
      },
      next: { revalidate: 1800 },
    });

    if (!response.ok) {
      return [];
    }

    const xml = await response.text();
    return parseYouTubeChannelFeed(xml).slice(0, limit);
  } catch {
    return [];
  }
}

export const getChannelSermons = unstable_cache(
  async () => loadChannelSermons(24),
  ["shanah-city-youtube-sermons-v1", getShanahCityYouTubeChannelId()],
  { revalidate: 1800 },
);

export function formatSermonDate(publishedAt: string) {
  const date = new Date(publishedAt);
  if (Number.isNaN(date.getTime())) return "Recent message";
  return date.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}
