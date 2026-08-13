import type { StreamPreview } from "./types";
import { site } from "./site";
import { getFacebookVideoEmbedUrl, liveVideoConfig } from "./live-config";

const facebookPicture = (page: string) =>
  `https://graph.facebook.com/${page}/picture?width=640&height=360`;

const instagramPreviews: StreamPreview[] = site.social.instagram.map((account) => ({
  id: account.handle === "shanahcity" ? "instagram-city" : "instagram-revival",
  platform: "Instagram",
  label: account.name,
  handle: account.handle,
  url: account.url,
  thumbnail:
    account.handle === "shanahcity"
      ? "/streams/instagram-shanah-city.svg"
      : "/streams/instagram-shanah-revival.svg",
}));

export const streamPreviews: StreamPreview[] = [
  {
    id: "youtube",
    platform: "YouTube",
    label: "Shanah City",
    url: "https://www.youtube.com/@ShanahCity",
    thumbnail: "/streams/youtube-shanah-city.svg",
    videoId: "",
  },
  {
    id: "facebook-city",
    platform: "Facebook",
    label: "Shanah City",
    url: "https://www.facebook.com/ShanahCity",
    thumbnail: facebookPicture("ShanahCity"),
    fallbackThumbnail: "/streams/facebook-shanah-city.svg",
    embedUrl: liveVideoConfig.facebook.shanahCityLiveUrl
      ? getFacebookVideoEmbedUrl(liveVideoConfig.facebook.shanahCityLiveUrl)
      : undefined,
  },
  {
    id: "facebook-revival",
    platform: "Facebook",
    label: "Shanah Revival",
    url: "https://www.facebook.com/ShanahRevival",
    thumbnail: facebookPicture("ShanahRevival"),
    fallbackThumbnail: "/streams/facebook-shanah-revival.svg",
    embedUrl: liveVideoConfig.facebook.shanahRevivalLiveUrl
      ? getFacebookVideoEmbedUrl(liveVideoConfig.facebook.shanahRevivalLiveUrl)
      : undefined,
  },
  ...instagramPreviews,
];
export function getYouTubeEmbedUrl(videoId: string) {
  return `https://www.youtube-nocookie.com/embed/${videoId}?rel=0&modestbranding=1`;
}

export function getYouTubeThumbnail(videoId: string) {
  return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
}

export function getStreamThumbnail(preview: StreamPreview) {
  if (preview.videoId) {
    return getYouTubeThumbnail(preview.videoId);
  }
  return preview.thumbnail;
}

export function getStreamFallbackThumbnail(preview: StreamPreview) {
  if (preview.fallbackThumbnail) {
    return preview.fallbackThumbnail;
  }
  if (preview.id === "youtube") {
    return "/streams/youtube-shanah-city.svg";
  }
  if (preview.id.startsWith("instagram-")) {
    return preview.thumbnail;
  }
  return preview.thumbnail;
}
