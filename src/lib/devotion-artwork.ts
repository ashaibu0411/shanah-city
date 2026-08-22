import type { Devotion } from "@/lib/types";

export type ArtworkVariant = "square" | "wide" | "banner";

export const ARTWORK_VARIANTS: Array<{
  variant: ArtworkVariant;
  label: string;
  hint: string;
}> = [
  { variant: "square", label: "Square", hint: "1024 × 1024 · tiles & push" },
  { variant: "wide", label: "Wide", hint: "1920 × 1080 · cards & hero" },
  { variant: "banner", label: "Banner", hint: "1920 × 692 · headers" },
];

export function devotionArtworkField(variant: ArtworkVariant) {
  if (variant === "square") return "artworkSquareUrl" as const;
  if (variant === "wide") return "artworkWideUrl" as const;
  return "artworkBannerUrl" as const;
}

export function getDevotionArtwork(
  devotion: Pick<Devotion, "artworkSquareUrl" | "artworkWideUrl" | "artworkBannerUrl">,
  prefer: ArtworkVariant = "wide",
) {
  const order: ArtworkVariant[] =
    prefer === "square"
      ? ["square", "wide", "banner"]
      : prefer === "banner"
        ? ["banner", "wide", "square"]
        : ["wide", "banner", "square"];

  for (const variant of order) {
    const field = devotionArtworkField(variant);
    const url = devotion[field];
    if (url) return url;
  }
  return null;
}
