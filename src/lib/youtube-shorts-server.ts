import { unstable_cache } from "next/cache";
import { getShanahCityYouTubeChannelId } from "@/lib/youtube-sermons-server";
import { fetchYouTubeOEmbed } from "@/lib/worship-youtube-utils";

export type YouTubeShortEntry = {
  videoId: string;
  title: string;
  publishedAt?: string;
};

const SHORTS_MAX_SECONDS = 180;

function parseIso8601DurationSeconds(iso: string): number | null {
  const match = iso.match(/^PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/);
  if (!match) return null;
  const hours = Number(match[1] ?? 0);
  const minutes = Number(match[2] ?? 0);
  const seconds = Number(match[3] ?? 0);
  return hours * 3600 + minutes * 60 + seconds;
}

function extractShortIdsFromShortsPageHtml(html: string, limit: number): string[] {
  const ids: string[] = [];
  const seen = new Set<string>();

  const patterns = [
    /"url"\s*:\s*"\/shorts\/([a-zA-Z0-9_-]{11})"/g,
    /\/shorts\/([a-zA-Z0-9_-]{11})/g,
  ];

  for (const pattern of patterns) {
    let match: RegExpExecArray | null;
    while ((match = pattern.exec(html)) !== null) {
      const id = match[1];
      if (seen.has(id)) continue;
      seen.add(id);
      ids.push(id);
      if (ids.length >= limit) return ids;
    }
  }

  return ids;
}

async function fetchShortsViaDataApi(
  channelId: string,
  apiKey: string,
  limit: number,
): Promise<YouTubeShortEntry[]> {
  const searchUrl = new URL("https://www.googleapis.com/youtube/v3/search");
  searchUrl.searchParams.set("part", "snippet");
  searchUrl.searchParams.set("channelId", channelId);
  searchUrl.searchParams.set("type", "video");
  searchUrl.searchParams.set("order", "date");
  searchUrl.searchParams.set("videoDuration", "short");
  searchUrl.searchParams.set("maxResults", String(Math.min(limit * 3, 50)));
  searchUrl.searchParams.set("key", apiKey);

  const searchResponse = await fetch(searchUrl.toString(), {
    next: { revalidate: 1800 },
  });
  if (!searchResponse.ok) return [];

  const searchData = (await searchResponse.json()) as {
    items?: Array<{ id?: { videoId?: string }; snippet?: { title?: string; publishedAt?: string } }>;
  };

  const candidates: YouTubeShortEntry[] = [];
  for (const item of searchData.items ?? []) {
    const videoId = item.id?.videoId?.trim();
    const title = item.snippet?.title?.trim();
    if (!videoId || !title) continue;
    candidates.push({
      videoId,
      title,
      publishedAt: item.snippet?.publishedAt,
    });
  }

  if (candidates.length === 0) return [];

  const videosUrl = new URL("https://www.googleapis.com/youtube/v3/videos");
  videosUrl.searchParams.set("part", "contentDetails,snippet");
  videosUrl.searchParams.set("id", candidates.map((item) => item.videoId).join(","));
  videosUrl.searchParams.set("key", apiKey);

  const videosResponse = await fetch(videosUrl.toString(), {
    next: { revalidate: 1800 },
  });
  if (!videosResponse.ok) return candidates.slice(0, limit);

  const videosData = (await videosResponse.json()) as {
    items?: Array<{
      id?: string;
      snippet?: { title?: string; publishedAt?: string };
      contentDetails?: { duration?: string };
    }>;
  };

  const shortEntries: YouTubeShortEntry[] = [];
  for (const item of videosData.items ?? []) {
    const videoId = item.id?.trim();
    const duration = item.contentDetails?.duration;
    if (!videoId || !duration) continue;
    const seconds = parseIso8601DurationSeconds(duration);
    if (seconds === null || seconds > SHORTS_MAX_SECONDS) continue;
    shortEntries.push({
      videoId,
      title: item.snippet?.title?.trim() || "YouTube Short",
      publishedAt: item.snippet?.publishedAt,
    });
    if (shortEntries.length >= limit) break;
  }

  return shortEntries;
}

async function fetchShortsFromChannelShortsTab(
  channelId: string,
  limit: number,
): Promise<YouTubeShortEntry[]> {
  const pageUrl = `https://www.youtube.com/channel/${encodeURIComponent(channelId)}/shorts`;

  try {
    const response = await fetch(pageUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; ShanahCityApp/1.0; +https://shanah-city.vercel.app)",
        Accept: "text/html,application/xhtml+xml",
        "Accept-Language": "en-US,en;q=0.9",
      },
      next: { revalidate: 1800 },
    });

    if (!response.ok) return [];

    const html = await response.text();
    const videoIds = extractShortIdsFromShortsPageHtml(html, limit);
    if (videoIds.length === 0) return [];

    const entries = await Promise.all(
      videoIds.map(async (videoId) => {
        const oEmbed = await fetchYouTubeOEmbed(videoId);
        return {
          videoId,
          title: oEmbed?.title?.trim() || "YouTube Short",
        } satisfies YouTubeShortEntry;
      }),
    );

    return entries;
  } catch {
    return [];
  }
}

async function loadChannelShorts(limit = 12): Promise<YouTubeShortEntry[]> {
  const channelId = getShanahCityYouTubeChannelId();
  const apiKey = process.env.YOUTUBE_API_KEY?.trim();

  if (apiKey) {
    const fromApi = await fetchShortsViaDataApi(channelId, apiKey, limit);
    if (fromApi.length > 0) return fromApi;
  }

  return fetchShortsFromChannelShortsTab(channelId, limit);
}

export const getChannelYouTubeShorts = unstable_cache(
  async (limit = 12) => loadChannelShorts(limit),
  ["shanah-city-youtube-shorts-v1", getShanahCityYouTubeChannelId()],
  { revalidate: 1800 },
);
