/** Explore grid tiles — real church photos from the home hero gallery. */

export const homeExploreTileImages = {
  /** Offering usher with basket — literal give / support ministry. */
  give: "/home/home-gallery-38.jpg",
  /** Diverse friends together — welcoming, plan-a-visit energy. */
  connect: "/home/home-gallery-08.jpg",
  /** Multicultural lineup at a shared moment — fellowship at scale. */
  community: "/home/home-gallery-75.jpg",
  /** Stage worship and live event — Sundays and calendar moments. */
  calendar: "/home/home-gallery-15.jpg",
} as const;

/** Home + Media “Watch Live” top banner (same photo everywhere). */
export const homeLiveSpotlightImage = "/home/home-gallery-88.jpg";

export const homeLiveSpotlightMediaClass =
  "object-cover object-[center_28%]";

export type HomeExploreTileId = keyof typeof homeExploreTileImages;

/** Per-tile crop/zoom so key details stay in frame on small Explore cards. */
export function homeExploreTileImageClass(id: HomeExploreTileId): string {
  if (id === "give") {
    return "mobile-premium-4k__media--give-tile object-contain object-bottom";
  }
  return "object-cover object-center";
}
