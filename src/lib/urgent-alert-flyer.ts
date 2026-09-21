import type { UrgentAlert } from "@/lib/urgent-alert-types";

/** Portrait church flyers (8.5×11, social story, etc.) vs landscape/wide graphics. */
export function isPortraitFlyerDimensions(width: number, height: number) {
  if (width <= 0 || height <= 0) return false;
  return height / width >= 1.05;
}

type FlyerArtworkFields = Pick<
  UrgentAlert,
  "imageUrl" | "artworkSquareUrl" | "artworkWideUrl" | "artworkBannerUrl"
>;

/** One uploaded flyer fills missing share/push artwork slots automatically. */
export function applyUrgentAlertFlyerArtwork<T extends FlyerArtworkFields>(fields: T): T {
  const flyer = fields.imageUrl?.trim();
  if (!flyer) {
    return fields;
  }
  return {
    ...fields,
    artworkSquareUrl: fields.artworkSquareUrl?.trim() || flyer,
    artworkWideUrl: fields.artworkWideUrl?.trim() || flyer,
    artworkBannerUrl: fields.artworkBannerUrl?.trim() || flyer,
  };
}

export function urgentAlertFlyerImageClassName(
  portrait: boolean | null,
  context: "home" | "admin-preview",
) {
  const base =
    "w-full rounded-2xl object-contain shadow-lg ring-1 ring-white/15 bg-white/95 dark:bg-night-950/40";
  if (portrait === true) {
    return context === "admin-preview"
      ? `${base} max-h-[min(70vh,520px)]`
      : `${base} max-h-[min(75vh,680px)]`;
  }
  if (portrait === false) {
    return `${base} max-h-64 md:max-h-72`;
  }
  return `${base} max-h-96 md:max-h-[28rem]`;
}
