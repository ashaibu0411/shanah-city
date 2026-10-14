import { site } from "@/lib/site";

export type SermonVideo = {
  id: string;
  title: string;
  publishedAt: string;
  watchUrl: string;
  thumbnailUrl: string;
};

export function getShanahCityYouTubeChannelUrl() {
  return site.social.youtube;
}

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
