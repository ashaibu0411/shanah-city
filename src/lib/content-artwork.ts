export type ArtworkVariant = "square" | "wide" | "banner";

export type ArtworkFields = {
  artworkSquareUrl?: string;
  artworkWideUrl?: string;
  artworkBannerUrl?: string;
};

export const ARTWORK_VARIANTS: Array<{
  variant: ArtworkVariant;
  label: string;
  hint: string;
}> = [
  { variant: "square", label: "Square", hint: "1024 × 1024 · tiles & push" },
  { variant: "wide", label: "Wide", hint: "1920 × 1080 · cards & hero" },
  { variant: "banner", label: "Banner", hint: "1920 × 692 · headers" },
];

export function artworkField(variant: ArtworkVariant) {
  if (variant === "square") return "artworkSquareUrl" as const;
  if (variant === "wide") return "artworkWideUrl" as const;
  return "artworkBannerUrl" as const;
}

export function getContentArtwork(
  record: ArtworkFields,
  prefer: ArtworkVariant = "wide",
) {
  const order: ArtworkVariant[] =
    prefer === "square"
      ? ["square", "wide", "banner"]
      : prefer === "banner"
        ? ["banner", "wide", "square"]
        : ["wide", "banner", "square"];

  for (const variant of order) {
    const field = artworkField(variant);
    const url = record[field];
    if (url) return url;
  }
  return null;
}
