/** Live stream IDs/URLs — set in .env.local when you go live. */

export const liveVideoConfig = {
  /** Find at youtube.com → channel → About → Share channel → Copy channel ID (starts with UC) */
  youtubeChannelId: process.env.NEXT_PUBLIC_YOUTUBE_CHANNEL_ID ?? "",
  facebook: {
    /** Full URL of the live video post, e.g. facebook.com/ShanahCity/videos/123... */
    shanahCityLiveUrl: process.env.NEXT_PUBLIC_FACEBOOK_CITY_LIVE_URL ?? "",
    shanahRevivalLiveUrl: process.env.NEXT_PUBLIC_FACEBOOK_REVIVAL_LIVE_URL ?? "",
  },
} as const;

export function getYouTubeLiveChannelEmbedUrl(channelId: string) {
  return `https://www.youtube.com/embed/live_stream?channel=${channelId}&rel=0&modestbranding=1&playsinline=1`;
}

export function getFacebookVideoEmbedUrl(videoPageUrl: string) {
  const href = encodeURIComponent(videoPageUrl);
  return `https://www.facebook.com/plugins/video.php?href=${href}&show_text=false&width=560&height=315`;
}

export function canPlayInApp(preview: {
  id: string;
  platform: string;
  videoId?: string;
  embedUrl?: string;
}) {
  if (preview.platform === "YouTube") {
    return Boolean(preview.videoId || liveVideoConfig.youtubeChannelId);
  }
  if (preview.platform === "Facebook") {
    return Boolean(preview.embedUrl);
  }
  return false;
}

export function getInAppEmbedUrl(preview: {
  id: string;
  platform: string;
  videoId?: string;
  embedUrl?: string;
}) {
  if (preview.platform === "YouTube") {
    if (preview.videoId) {
      return `https://www.youtube-nocookie.com/embed/${preview.videoId}?rel=0&modestbranding=1&playsinline=1`;
    }
    if (liveVideoConfig.youtubeChannelId) {
      return getYouTubeLiveChannelEmbedUrl(liveVideoConfig.youtubeChannelId);
    }
  }
  if (preview.platform === "Facebook" && preview.embedUrl) {
    return preview.embedUrl;
  }
  return null;
}
