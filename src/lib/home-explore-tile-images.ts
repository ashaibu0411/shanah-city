/** Explore grid tiles — real church photos from the home hero gallery. */

export const homeExploreTileImages = {
  /** Premium give tile — generosity graphic with scripture. */
  give: "/home/home-gallery-give-tile.jpg",
  /** Diverse friends together — welcoming, plan-a-visit energy. */
  connect: "/home/home-gallery-08.jpg",
  /** Multicultural lineup at a shared moment — fellowship at scale. */
  community: "/home/home-gallery-75.jpg",
  /** Transformed Woman event — community gatherings on the calendar. */
  calendar: "/home/home-gallery-93.jpg",
} as const;

/** Home + Media “Watch Live” top banner (same photo everywhere). */
export const homeLiveSpotlightImage = "/home/home-gallery-88.jpg";

export const homeLiveSpotlightMediaClass =
  "object-cover object-[center_28%]";

export type HomeExploreTileId = keyof typeof homeExploreTileImages;

/** Per-tile crop/zoom so key details stay in frame on small Explore cards. */
export function homeExploreTileImageClass(id: HomeExploreTileId): string {
  if (id === "give") {
    return "mobile-premium-4k__media--give-tile object-cover object-center";
  }
  if (id === "calendar") {
    return "object-cover object-[center_34%]";
  }
  return "object-cover object-center";
}
