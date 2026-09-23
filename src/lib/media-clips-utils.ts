export function getYouTubeClipEmbedUrl(videoId: string) {
  return `https://www.youtube-nocookie.com/embed/${videoId}?rel=0&modestbranding=1&playsinline=1`;
}

export function getYouTubeClipThumbnail(videoId: string) {
  return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
}

export function getYouTubeClipWatchUrl(videoId: string) {
  return `https://www.youtube.com/shorts/${videoId}`;
}

export function getYouTubeVideoWatchUrl(videoId: string) {
  return `https://www.youtube.com/watch?v=${videoId}`;
}

export function isUploadedMediaClip(clip: { platform: string; videoId?: string; url: string }) {
  if (clip.platform === "upload") return true;
  if (clip.videoId) return false;
  return /\.(mp4|webm|mov|m4v)(\?|$)/i.test(clip.url);
}

export function mediaClipPlatformLabel(platform: string) {
  if (platform === "upload") return "Shanah";
  if (platform === "youtube") return "YouTube";
  if (platform === "instagram") return "Instagram";
  if (platform === "facebook") return "Facebook";
  return platform;
}

export function parseYouTubeVideoId(input: string) {
  const trimmed = input.trim();
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
    return trimmed;
  }

  const patterns = [
    /(?:youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/,
    /(?:youtube\.com\/watch\?v=)([a-zA-Z0-9_-]{11})/,
    /(?:youtube\.com\/watch\?.*[&?]v=)([a-zA-Z0-9_-]{11})/,
    /(?:youtu\.be\/)([a-zA-Z0-9_-]{11})/,
    /(?:youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
  ];

  for (const pattern of patterns) {
    const match = trimmed.match(pattern);
    if (match?.[1]) {
      return match[1];
    }
  }

  return null;
}

const YOUTUBE_URL_PATTERN =
  /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:shorts\/|watch\?(?:.*&)?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/gi;

/** Unique video IDs found in message text or captions (order preserved). */
export function extractYouTubeVideoIdsFromText(text: string): string[] {
  const ids: string[] = [];
  const seen = new Set<string>();
  const regex = new RegExp(YOUTUBE_URL_PATTERN.source, YOUTUBE_URL_PATTERN.flags);
  let match: RegExpExecArray | null;
  while ((match = regex.exec(text)) !== null) {
    const id = match[1];
    if (!seen.has(id)) {
      seen.add(id);
      ids.push(id);
    }
  }
  return ids;
}

export function normalizeYouTubeMediaClip(clip: {
  platform: string;
  url: string;
  videoId?: string;
  thumbnail?: string;
}): { videoId?: string; thumbnail?: string } {
  if (clip.platform !== "youtube") return { videoId: clip.videoId, thumbnail: clip.thumbnail };
  const videoId = clip.videoId ?? parseYouTubeVideoId(clip.url) ?? undefined;
  if (!videoId) return { videoId: clip.videoId, thumbnail: clip.thumbnail };
  return {
    videoId,
    thumbnail: clip.thumbnail ?? getYouTubeClipThumbnail(videoId),
  };
}
