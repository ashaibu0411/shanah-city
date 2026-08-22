import { unstable_cache } from "next/cache";
import { site } from "@/lib/site";

export type ChurchSocialImages = {
  live: string;
  give: string;
  connect: string;
  community: string;
  devotions: string;
  mediaLive: string;
  mediaShorts: string;
  source: "facebook" | "mixed" | "fallback";
};

const FACEBOOK_PAGES = {
  city: process.env.FACEBOOK_CITY_PAGE_ID ?? "ShanahCity",
  revival: process.env.FACEBOOK_REVIVAL_PAGE_ID ?? "ShanahRevival",
} as const;

/** Wordless photographic tiles — UI supplies all labels. */
const STATIC_BACKGROUNDS: ChurchSocialImages = {
  live: "/mobile-flyers/live.png",
  give: "/mobile-flyers/give.png",
  connect: "/mobile-flyers/connect.png",
  community: "/mobile-flyers/community.png",
  devotions: "/mobile-flyers/devotions.png",
  mediaLive: "/mobile-flyers/live.png",
  mediaShorts: "/mobile-flyers/media-shorts.png",
  source: "fallback",
};

type FacebookPageCoverResponse = {
  cover?: { source?: string };
};

async function fetchFacebookCoverPhoto(page: string, token: string) {
  const fields = "cover{source}";
  const url = `https://graph.facebook.com/v21.0/${page}?fields=${encodeURIComponent(fields)}&access_token=${encodeURIComponent(token)}`;
  const response = await fetch(url, { next: { revalidate: 1800 } });
  if (!response.ok) return null;
  const data = (await response.json()) as FacebookPageCoverResponse;
  return data.cover?.source ?? null;
}

function liveYouTubeThumbnail() {
  return null;
}

async function loadChurchSocialImages(): Promise<ChurchSocialImages> {
  const token = process.env.FACEBOOK_PAGE_ACCESS_TOKEN?.trim();
  const youtubeLive = liveYouTubeThumbnail();

  let coverPhoto: string | null = null;
  if (token) {
    coverPhoto = await fetchFacebookCoverPhoto(FACEBOOK_PAGES.city, token);
  }

  const liveBackground = youtubeLive ?? coverPhoto ?? STATIC_BACKGROUNDS.live;

  return {
    live: liveBackground,
    give: STATIC_BACKGROUNDS.give,
    connect: STATIC_BACKGROUNDS.connect,
    community: STATIC_BACKGROUNDS.community,
    devotions: STATIC_BACKGROUNDS.devotions,
    mediaLive: liveBackground,
    mediaShorts: STATIC_BACKGROUNDS.mediaShorts,
    source: coverPhoto || youtubeLive ? "mixed" : "fallback",
  };
}

export const getChurchSocialImages = unstable_cache(
  loadChurchSocialImages,
  ["church-social-images-v2", FACEBOOK_PAGES.city],
  { revalidate: 1800 },
);

export function churchSocialImageForAction(
  images: ChurchSocialImages,
  action: "give" | "connect" | "community" | "devotions",
) {
  return images[action];
}

export const churchFacebookPages = site.social.facebook;
