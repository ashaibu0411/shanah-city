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
