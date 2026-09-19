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

/** Home “Watch Live” hero — stage, speaker, and congregation depth. */
export const homeLiveSpotlightImage = "/home/home-gallery-88.jpg";

/** Media tab top banner — wider stage shot keeps faces in frame. */
export const homeMediaPageHeroImage = "/home/home-gallery-15.jpg";

/** Media live countdown stage — worship on stage behind the timer. */
export const homeMediaCountdownBackdropImage = "/home/home-gallery-56.jpg";

export type HomeExploreTileId = keyof typeof homeExploreTileImages;

/** Per-tile crop/zoom so key details stay in frame on small Explore cards. */
export function homeExploreTileImageClass(id: HomeExploreTileId): string {
  if (id === "give") {
    return "object-cover object-[50%_72%] scale-[0.84] origin-center";
  }
  return "object-cover object-center";
}
