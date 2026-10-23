import { liveVideoConfig } from "@/lib/live-config";
import { getYouTubeVideoWatchUrl } from "@/lib/media-clips-utils";
import { getYouTubeThumbnail } from "@/lib/streams";
import { fetchYouTubeOEmbed } from "@/lib/worship-youtube-utils";
import type { SermonVideo } from "@/lib/youtube-sermons-shared";

export type { SermonVideo } from "@/lib/youtube-sermons-shared";
export { formatSermonDate } from "@/lib/youtube-sermons-shared";

const DEFAULT_CHANNEL_ID = "UC4q0d9NgxRREu8kr1kUMDxw";
const SHANAH_YOUTUBE_HANDLE = "ShanahCity";
const MIN_SERMON_SECONDS = 120;

export function getShanahCityYouTubeChannelId() {
  return liveVideoConfig.youtubeChannelId.trim() || DEFAULT_CHANNEL_ID;
}

export { getShanahCityYouTubeChannelUrl } from "@/lib/youtube-sermons-shared";

function decodeXmlText(value: string) {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'");
}

function readEntryTitle(entry: string) {
  const cdata = entry.match(/<title><!\[CDATA\[([\s\S]*?)\]\]><\/title>/);
  if (cdata?.[1]) return decodeXmlText(cdata[1].trim());
  const plain = entry.match(/<title>([^<]+)<\/title>/);
  return plain?.[1] ? decodeXmlText(plain[1].trim()) : "";
}

function parseIso8601DurationSeconds(iso: string): number | null {
  const match = iso.match(/^PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/);
  if (!match) return null;
  const hours = Number(match[1] ?? 0);
  const minutes = Number(match[2] ?? 0);
  const seconds = Number(match[3] ?? 0);
  return hours * 3600 + minutes * 60 + seconds;
}

function parseYouTubeChannelFeed(xml: string): SermonVideo[] {
  const entries = xml.split("<entry>").slice(1);

  return entries
    .map((entry) => {
      const id = entry.match(/<yt:videoId>([^<]+)<\/yt:videoId>/)?.[1]?.trim();
      const title = readEntryTitle(entry);
      const publishedAt = entry.match(/<published>([^<]+)<\/published>/)?.[1]?.trim();
      if (!id || !title || !publishedAt) return null;
      if (entry.includes("/shorts/")) return null;
      if (/^#\s*shorts?\b/i.test(title)) return null;

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

async function resolveChannelIdFromHandle(handle: string): Promise<string | null> {
  const normalized = handle.replace(/^@/, "").trim();
  if (!normalized) return null;

  try {
    const response = await fetch(`https://www.youtube.com/@${encodeURIComponent(normalized)}`, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept-Language": "en-US,en;q=0.9",
      },
      cache: "no-store",
    });
    if (!response.ok) return null;

    const html = await response.text();
    const patterns = [
      /"channelId":"(UC[a-zA-Z0-9_-]{20,})"/,
      /"externalId":"(UC[a-zA-Z0-9_-]{20,})"/,
      /channel_id=(UC[a-zA-Z0-9_-]{20,})/,
    ];
    for (const pattern of patterns) {
      const match = html.match(pattern);
      if (match?.[1]) return match[1];
    }
  } catch {
    return null;
  }

  return null;
}

async function resolveSermonChannelId(): Promise<string> {
  const configured = liveVideoConfig.youtubeChannelId.trim();
  if (configured) return configured;

  const scraped = await resolveChannelIdFromHandle(SHANAH_YOUTUBE_HANDLE);
  if (scraped) return scraped;

  return DEFAULT_CHANNEL_ID;
}

function toSermonVideo(id: string, title: string, publishedAt: string): SermonVideo {
  return {
    id,
    title,
    publishedAt,
    watchUrl: getYouTubeVideoWatchUrl(id),
    thumbnailUrl: getYouTubeThumbnail(id),
  };
}

async function filterLongFormVideos(videos: SermonVideo[], apiKey: string): Promise<SermonVideo[]> {
  if (videos.length === 0) return videos;

  const ids = videos.map((video) => video.id).join(",");
  const url = new URL("https://www.googleapis.com/youtube/v3/videos");
  url.searchParams.set("part", "contentDetails");
  url.searchParams.set("id", ids);
  url.searchParams.set("key", apiKey);

  const response = await fetch(url.toString(), { cache: "no-store" });
  if (!response.ok) return videos;

  const data = (await response.json()) as {
    items?: Array<{ id?: string; contentDetails?: { duration?: string } }>;
  };
  const durationById = new Map<string, number>();
  for (const item of data.items ?? []) {
    const id = item.id?.trim();
    const duration = item.contentDetails?.duration;
    if (!id || !duration) continue;
    const seconds = parseIso8601DurationSeconds(duration);
    if (seconds != null) durationById.set(id, seconds);
  }

  return videos.filter((video) => {
    const seconds = durationById.get(video.id);
    if (seconds == null) return true;
    return seconds >= MIN_SERMON_SECONDS;
  });
}

async function fetchSermonsViaUploadsPlaylist(
  channelId: string,
  apiKey: string,
  limit: number,
): Promise<SermonVideo[]> {
  const channelUrl = new URL("https://www.googleapis.com/youtube/v3/channels");
  channelUrl.searchParams.set("part", "contentDetails");
  channelUrl.searchParams.set("id", channelId);
  channelUrl.searchParams.set("key", apiKey);

  const channelResponse = await fetch(channelUrl.toString(), { cache: "no-store" });
  if (!channelResponse.ok) return [];

  const channelData = (await channelResponse.json()) as {
    items?: Array<{ contentDetails?: { relatedPlaylists?: { uploads?: string } } }>;
  };
  const uploadsPlaylistId = channelData.items?.[0]?.contentDetails?.relatedPlaylists?.uploads?.trim();
  if (!uploadsPlaylistId) return [];

  const playlistUrl = new URL("https://www.googleapis.com/youtube/v3/playlistItems");
  playlistUrl.searchParams.set("part", "snippet,contentDetails");
  playlistUrl.searchParams.set("playlistId", uploadsPlaylistId);
  playlistUrl.searchParams.set("maxResults", String(Math.min(limit, 50)));
  playlistUrl.searchParams.set("key", apiKey);

  const playlistResponse = await fetch(playlistUrl.toString(), { cache: "no-store" });
  if (!playlistResponse.ok) return [];

  const playlistData = (await playlistResponse.json()) as {
    items?: Array<{
      contentDetails?: { videoId?: string; videoPublishedAt?: string };
      snippet?: { title?: string; publishedAt?: string };
    }>;
  };

  const videos: SermonVideo[] = [];
  for (const item of playlistData.items ?? []) {
    const id = item.contentDetails?.videoId?.trim();
    const title = item.snippet?.title?.trim();
    const publishedAt =
      item.contentDetails?.videoPublishedAt?.trim() ?? item.snippet?.publishedAt?.trim();
    if (!id || !title || !publishedAt) continue;
    videos.push(toSermonVideo(id, title, publishedAt));
  }

  return filterLongFormVideos(videos, apiKey);
}

async function fetchSermonsViaSearchApi(
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

  const searchResponse = await fetch(searchUrl.toString(), { cache: "no-store" });
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
    videos.push(toSermonVideo(id, title, publishedAt));
  }

  return filterLongFormVideos(videos, apiKey);
}

const YOUTUBE_BROWSER_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  "Accept-Language": "en-US,en;q=0.9",
} as const;

function extractVideoIdsFromYouTubeHtml(html: string, max: number): string[] {
  const seen = new Set<string>();
  const ids: string[] = [];

  for (const match of html.matchAll(/"videoId":"([a-zA-Z0-9_-]{11})"/g)) {
    const id = match[1];
    if (!id || seen.has(id)) continue;
    seen.add(id);
    ids.push(id);
    if (ids.length >= max * 3) break;
  }

  return ids;
}

async function fetchSermonsViaChannelScrape(
  handle: string,
  channelId: string,
  limit: number,
): Promise<SermonVideo[]> {
  const normalized = handle.replace(/^@/, "").trim();
  const pageUrls = [
    normalized ? `https://www.youtube.com/@${encodeURIComponent(normalized)}/videos` : null,
    channelId ? `https://www.youtube.com/channel/${encodeURIComponent(channelId)}/videos` : null,
  ].filter((url): url is string => Boolean(url));

  for (const pageUrl of pageUrls) {
    try {
      const response = await fetch(pageUrl, {
        headers: {
          ...YOUTUBE_BROWSER_HEADERS,
          Accept: "text/html,application/xhtml+xml;q=0.9,*/*;q=0.8",
        },
        cache: "no-store",
      });
      if (!response.ok) continue;

      const html = await response.text();
      const candidateIds = extractVideoIdsFromYouTubeHtml(html, limit);
      if (candidateIds.length === 0) continue;

      const videos: SermonVideo[] = [];
      for (const id of candidateIds) {
        const oEmbed = await fetchYouTubeOEmbed(id);
        const title = oEmbed?.title?.trim() || "Latest message";
        if (/^#?\s*shorts?\b/i.test(title)) continue;

        videos.push(toSermonVideo(id, title, new Date().toISOString()));
        if (videos.length >= limit) return videos;
      }

      if (videos.length > 0) return videos;
    } catch {
      continue;
    }
  }

  return [];
}

async function fetchSermonsViaRss(channelId: string, limit: number): Promise<SermonVideo[]> {
  const feedUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=${encodeURIComponent(channelId)}`;

  const response = await fetch(feedUrl, {
    headers: {
      ...YOUTUBE_BROWSER_HEADERS,
      Accept: "application/atom+xml, application/xml, text/xml;q=0.9, */*;q=0.8",
    },
    cache: "no-store",
  });

  if (!response.ok) return [];

  const xml = await response.text();
  return parseYouTubeChannelFeed(xml).slice(0, limit);
}

export async function loadChannelSermons(limit = 50): Promise<SermonVideo[]> {
  const channelId = await resolveSermonChannelId();
  const apiKey = process.env.YOUTUBE_API_KEY?.trim();

  if (apiKey) {
    const fromUploads = await fetchSermonsViaUploadsPlaylist(channelId, apiKey, limit);
    if (fromUploads.length > 0) return fromUploads.slice(0, limit);

    const fromSearch = await fetchSermonsViaSearchApi(channelId, apiKey, limit);
    if (fromSearch.length > 0) return fromSearch.slice(0, limit);
  }

  const fromRss = await fetchSermonsViaRss(channelId, limit);
  if (fromRss.length > 0) return fromRss;

  if (channelId !== DEFAULT_CHANNEL_ID) {
    const fallbackRss = await fetchSermonsViaRss(DEFAULT_CHANNEL_ID, limit);
    if (fallbackRss.length > 0) return fallbackRss;
  }

  const fromScrape = await fetchSermonsViaChannelScrape(SHANAH_YOUTUBE_HANDLE, channelId, limit);
  if (fromScrape.length > 0) return fromScrape;

  return [];
}

export async function getChannelSermons(limit = 50) {
  return loadChannelSermons(limit);
}
