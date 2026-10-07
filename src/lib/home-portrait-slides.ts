/** Home hero cinema slides (paths under /public/home). */

export type HomePortraitSlideTone = "warm" | "golden" | "cool" | "vivid" | "deep";
export type HomePortraitSlideMotion =
  | "zoom-in"
  | "zoom-out"
  | "pan-left"
  | "pan-right"
  | "drift-up"
  | "drift-down";

export type HomePortraitSlide = {
  src: string;
  label: string;
  focus: string;
  tone: HomePortraitSlideTone;
  motion: HomePortraitSlideMotion;
};

const pastorSlides: HomePortraitSlide[] = [
  {
    src: "/home/pastor-portrait.jpg",
    label: "Leadership",
    focus: "50% 18%",
    tone: "warm",
    motion: "zoom-in",
  },
  {
    src: "/home/pastor-portrait-casual.jpg",
    label: "Pastoral care",
    focus: "48% 22%",
    tone: "golden",
    motion: "pan-right",
  },
  {
    src: "/home/pastor-portrait-ministry.jpg",
    label: "Ministry",
    focus: "52% 20%",
    tone: "vivid",
    motion: "drift-up",
  },
];

const GALLERY_COUNT = 92;

function galleryPath(index: number) {
  const n = String(index).padStart(2, "0");
  return `/home/home-gallery-${n}.jpg`;
}

const galleryLabels = [
  "Worship",
  "Community",
  "Family",
  "Youth",
  "Prayer",
  "Outreach",
  "Celebration",
  "Discipleship",
  "Kids",
  "Missions",
  "Fellowship",
  "Sunday",
  "Accra",
  "Aurora",
  "Baptism",
  "Small groups",
  "Team",
  "Gathering",
] as const;

const galleryFocuses = [
  "50% 28%",
  "42% 32%",
  "58% 24%",
  "50% 38%",
  "46% 22%",
  "54% 30%",
  "48% 26%",
  "52% 34%",
] as const;

const galleryTones: HomePortraitSlideTone[] = ["warm", "golden", "cool", "vivid", "deep"];
const galleryMotions: HomePortraitSlideMotion[] = [
  "zoom-in",
  "pan-left",
  "pan-right",
  "drift-up",
  "zoom-out",
  "drift-down",
];

/** Spread picks across the full gallery so every service season feels represented. */
const galleryPickIndices = [
  2, 6, 9, 13, 17, 21, 25, 29, 33, 37, 41, 45, 49, 53, 57, 61, 65, 69, 73, 77, 81, 85, 89, 92,
];

function gallerySlide(pick: number, deckIndex: number): HomePortraitSlide {
  const index = Math.min(Math.max(pick, 1), GALLERY_COUNT);
  return {
    src: galleryPath(index),
    label: galleryLabels[deckIndex % galleryLabels.length],
    focus: galleryFocuses[deckIndex % galleryFocuses.length],
    tone: galleryTones[deckIndex % galleryTones.length],
    motion: galleryMotions[deckIndex % galleryMotions.length],
  };
}

/** Curated, interleaved deck — diverse scenes without loading 90+ layers at once. */
export function getHomePortraitSlideDeck(): HomePortraitSlide[] {
  const deck: HomePortraitSlide[] = [];
  let galleryCursor = 0;

  for (let pastorIndex = 0; pastorIndex < pastorSlides.length; pastorIndex += 1) {
    deck.push(pastorSlides[pastorIndex]);
    const pick = galleryPickIndices[galleryCursor % galleryPickIndices.length];
    deck.push(gallerySlide(pick, galleryCursor));
    galleryCursor += 1;
  }

  while (galleryCursor < galleryPickIndices.length) {
    const pick = galleryPickIndices[galleryCursor];
    deck.push(gallerySlide(pick, galleryCursor));
    galleryCursor += 1;
  }

  return deck;
}

/** Legacy flat list (admin / references). */
export const homePortraitSlides = [
  ...pastorSlides.map((slide) => slide.src),
  ...Array.from({ length: GALLERY_COUNT }, (_, index) => galleryPath(index + 1)),
] as const;
