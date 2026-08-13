export function getYouTubeClipEmbedUrl(videoId: string) {
  return `https://www.youtube-nocookie.com/embed/${videoId}?rel=0&modestbranding=1&playsinline=1`;
}

export function getYouTubeClipThumbnail(videoId: string) {
  return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
}

export function getYouTubeClipWatchUrl(videoId: string) {
  return `https://www.youtube.com/shorts/${videoId}`;
}
