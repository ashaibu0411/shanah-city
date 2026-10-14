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

function decodeXmlText(value: string) {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'");
}

function readAtomTag(entry: string, tag: string) {
  const cdata = entry.match(new RegExp(`<${tag}><!\\[CDATA\\[([\\s\\S]*?)\\]\\]></${tag}>`));
  if (cdata?.[1]) return decodeXmlText(cdata[1].trim());
  const plain = entry.match(new RegExp(`<${tag}>([^<]*)</${tag}>`));
  return plain?.[1] ? decodeXmlText(plain[1].trim()) : "";
}

function parseYouTubeChannelFeed(xml: string): SermonVideo[] {
  const entries = xml.split("<entry>").slice(1);

  return entries
    .map((entry) => {
      const id = readAtomTag(entry, "yt:videoId") || entry.match(/<yt:videoId>([^<]+)<\/yt:videoId>/)?.[1]?.trim();
      const title = readAtomTag(entry, "title");
      const publishedAt = readAtomTag(entry, "published");
      if (!id || !title || !publishedAt) return null;
      if (entry.includes("/shorts/")) return null;

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

async function fetchSermonsViaDataApi(
  channelId: string,
  apiKey: string,
  limit: number,
): Promise<SermonVideo[]> {
  const searchUrl = new URL("https://www.googleapis.com/youtube/v3/search");
  searchUrl.searchParams.set("part", "snippet");
  searchUrl.searchParams.set("channelId", channelId);
  searchUrl.searchParams.set("type", "video");
  searchUrl.searchParams.set("order", "date");
  searchUrl.searchParams.set("maxResults", String(Math.min(limit, 50)));
  searchUrl.searchParams.set("key", apiKey);

  const searchResponse = await fetch(searchUrl.toString(), { next: { revalidate: 1800 } });
  if (!searchResponse.ok) return [];

  const searchData = (await searchResponse.json()) as {
    items?: Array<{ id?: { videoId?: string }; snippet?: { title?: string; publishedAt?: string } }>;
  };

  const videos: SermonVideo[] = [];
  for (const item of searchData.items ?? []) {
    const id = item.id?.videoId?.trim();
    const title = item.snippet?.title?.trim();
    const publishedAt = item.snippet?.publishedAt?.trim();
    if (!id || !title || !publishedAt) continue;
    videos.push({
      id,
      title,
      publishedAt,
      watchUrl: getYouTubeVideoWatchUrl(id),
      thumbnailUrl: getYouTubeThumbnail(id),
    });
    if (videos.length >= limit) break;
  }

  return videos;
}

async function loadChannelSermons(limit = 24): Promise<SermonVideo[]> {
  const channelId = getShanahCityYouTubeChannelId();
  const apiKey = process.env.YOUTUBE_API_KEY?.trim();

  if (apiKey) {
    const fromApi = await fetchSermonsViaDataApi(channelId, apiKey, limit);
    if (fromApi.length > 0) return fromApi;
  }

  const feedUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=${encodeURIComponent(channelId)}`;

  try {
    const response = await fetch(feedUrl, {
      headers: {
        "User-Agent": "ShanahCityApp/1.0 (+https://shanah-city.vercel.app)",
        Accept: "application/atom+xml, application/xml, text/xml;q=0.9, */*;q=0.8",
      },
      cache: "no-store",
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
  ["shanah-city-youtube-sermons-v2", getShanahCityYouTubeChannelId()],
  { revalidate: 900 },
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
