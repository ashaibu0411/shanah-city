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
  context: "home" | "admin-preview" | "community",
) {
  const base =
    context === "community"
      ? "w-full object-contain bg-transparent shadow-none ring-0 rounded-none"
      : "w-full rounded-2xl object-contain shadow-lg ring-1 ring-white/15 bg-white/95 dark:bg-night-950/40";
  if (portrait === true) {
    return context === "admin-preview"
      ? `${base} max-h-[min(70vh,520px)]`
      : `${base} max-h-[min(80vh,760px)] lg:max-h-[min(85vh,900px)]`;
  }
  if (portrait === false) {
    return context === "admin-preview"
      ? `${base} max-h-64 md:max-h-72`
      : `${base} max-h-64 md:max-h-[min(75vh,560px)] lg:max-h-[min(82vh,720px)]`;
  }
  return `${base} max-h-96 md:max-h-[min(75vh,640px)] lg:max-h-[min(85vh,900px)]`;
}
