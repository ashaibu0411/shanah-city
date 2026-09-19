/** Explore grid tiles — real church photos from the home hero gallery. */

export const homeExploreTileImages = {
  /** Congregation worship with open hands — giving heart and support. */
  give: "/home/home-gallery-20.jpg",
  /** Diverse friends together — welcoming, plan-a-visit energy. */
  connect: "/home/home-gallery-08.jpg",
  /** Multicultural lineup at a shared moment — fellowship at scale. */
  community: "/home/home-gallery-75.jpg",
  /** Stage worship and live event — Sundays and calendar moments. */
  calendar: "/home/home-gallery-15.jpg",
} as const;

export type HomeExploreTileId = keyof typeof homeExploreTileImages;
