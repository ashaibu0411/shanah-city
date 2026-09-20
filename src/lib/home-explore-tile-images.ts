/** Explore grid tiles — real church photos from the home hero gallery. */

export const homeExploreTileImages = {
  /** Premium give tile — generosity graphic with scripture. */
  give: "/home/home-gallery-give-tile.jpg",
  /** Premium connect tile — plan a visit graphic. */
  connect: "/home/home-gallery-connect-tile.jpg",
  /** Premium community tile — see what's new graphic. */
  community: "/home/home-gallery-community-tile.jpg",
  /** Premium calendar tile — events and RSVP graphic. */
  calendar: "/home/home-gallery-calendar-tile.jpg",
} as const;

/** Home + Media “Watch Live” top banner (same photo everywhere). */
export const homeLiveSpotlightImage = "/home/home-gallery-88.jpg";

export const homeLiveSpotlightMediaClass =
  "object-cover object-[center_28%]";

export type HomeExploreTileId = keyof typeof homeExploreTileImages;

/** Per-tile crop/zoom so key details stay in frame on small Explore cards. */
export function homeExploreTileImageClass(id: HomeExploreTileId): string {
  return "mobile-premium-4k__media--graphic-tile object-cover object-center";
}
