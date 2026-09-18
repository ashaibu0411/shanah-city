/** Home hero crossfade slides (paths under /public/home). */

const pastorSlides = [
  "/home/pastor-portrait.jpg",
  "/home/pastor-portrait-casual.jpg",
  "/home/pastor-portrait-ministry.jpg",
] as const;

const GALLERY_COUNT = 92;

const gallerySlides = Array.from({ length: GALLERY_COUNT }, (_, index) => {
  const n = String(index + 1).padStart(2, "0");
  return `/home/home-gallery-${n}.jpg`;
});

export const homePortraitSlides = [...pastorSlides, ...gallerySlides] as const;
