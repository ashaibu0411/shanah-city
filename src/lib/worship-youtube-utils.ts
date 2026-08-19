import {
  getYouTubeClipThumbnail,
  getYouTubeVideoWatchUrl,
  parseYouTubeVideoId,
} from "@/lib/media-clips-utils";

export type YouTubeOEmbed = {
  title: string;
  authorName?: string;
  thumbnailUrl?: string;
};

export async function fetchYouTubeOEmbed(videoId: string): Promise<YouTubeOEmbed | null> {
  const watchUrl = getYouTubeVideoWatchUrl(videoId);
  const endpoint = `https://www.youtube.com/oembed?url=${encodeURIComponent(watchUrl)}&format=json`;

  try {
    const response = await fetch(endpoint, { next: { revalidate: 3600 } });
    if (!response.ok) return null;
    const data = (await response.json()) as {
      title?: string;
      author_name?: string;
      thumbnail_url?: string;
    };
    if (!data.title?.trim()) return null;
    return {
      title: data.title.trim(),
      authorName: data.author_name?.trim() || undefined,
      thumbnailUrl: data.thumbnail_url?.trim() || getYouTubeClipThumbnail(videoId),
    };
  } catch {
    return null;
  }
}

export function resolveYouTubeVideo(source: string) {
  const videoId = parseYouTubeVideoId(source);
  if (!videoId) return null;
  return {
    videoId,
    watchUrl: getYouTubeVideoWatchUrl(videoId),
    thumbnailUrl: getYouTubeClipThumbnail(videoId),
  };
}

export async function lookupYouTubeVideo(source: string) {
  const resolved = resolveYouTubeVideo(source);
  if (!resolved) return null;
  const oEmbed = await fetchYouTubeOEmbed(resolved.videoId);
  return {
    ...resolved,
    title: oEmbed?.title,
    artist: oEmbed?.authorName,
  };
}
