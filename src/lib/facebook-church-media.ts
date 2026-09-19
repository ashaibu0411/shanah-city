import { unstable_cache } from "next/cache";
import { site } from "@/lib/site";
import { homeExploreTileImages, homeLiveSpotlightImage, type HomeExploreTileId } from "@/lib/home-explore-tile-images";

export type ChurchSocialImages = {
  live: string;
  give: string;
  connect: string;
  community: string;
  calendar: string;
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
  live: homeLiveSpotlightImage,
  give: homeExploreTileImages.give,
  connect: homeExploreTileImages.connect,
  community: homeExploreTileImages.community,
  calendar: homeExploreTileImages.calendar,
  devotions: "/mobile-flyers/devotions.png",
  mediaLive: homeLiveSpotlightImage,
  mediaShorts: "/mobile-flyers/media-shorts.png",
  source: "fallback",
};

function liveYouTubeThumbnail() {
  return null;
}

async function loadChurchSocialImages(): Promise<ChurchSocialImages> {
  const youtubeLive = liveYouTubeThumbnail();
  const liveBackground = youtubeLive ?? homeLiveSpotlightImage;

  return {
    live: liveBackground,
    give: STATIC_BACKGROUNDS.give,
    connect: STATIC_BACKGROUNDS.connect,
    community: STATIC_BACKGROUNDS.community,
    calendar: STATIC_BACKGROUNDS.calendar,
    devotions: STATIC_BACKGROUNDS.devotions,
    mediaLive: liveBackground,
    mediaShorts: STATIC_BACKGROUNDS.mediaShorts,
    source: youtubeLive ? "mixed" : "fallback",
  };
}

export const getChurchSocialImages = unstable_cache(
  loadChurchSocialImages,
  [
    "church-social-images-v5",
    FACEBOOK_PAGES.city,
    homeExploreTileImages.give,
    homeExploreTileImages.connect,
    homeExploreTileImages.community,
    homeExploreTileImages.calendar,
    homeLiveSpotlightImage,
  ],
  { revalidate: 1800 },
);

export function churchSocialImageForAction(
  images: ChurchSocialImages,
  action: "give" | "connect" | "community" | "devotions" | "calendar",
) {
  if (action in homeExploreTileImages) {
    return homeExploreTileImages[action as HomeExploreTileId];
  }
  return images[action];
}

export const churchFacebookPages = site.social.facebook;
