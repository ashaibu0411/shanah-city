import { site } from "@/lib/site";

/** Approved Premium Home V4 palette */
export const premiumHomeV4Colors = {
  midnight: "#061329",
  deepBlue: "#152744",
  cardNavy: "#1B2D4B",
  royalPurple: "#512D83",
  electricViolet: "#8B4DD8",
  gold: "#E9BC72",
  cream: "#F6EBD5",
  white: "#FFFFFF",
} as const;

export const premiumV4HeroMountainImage = "/home/premium-v4-mountain-hero.jpg";

/** Photo tiles only — no baked-in flyer graphics with embedded text. */
export const premiumV4CommunityFeatureImage = "/home/home-gallery-15.jpg";

export const premiumV4DevotionsBibleImage = "/home/premium-v4-devotions-bible.jpg";

export type PremiumHomeV4TileId = "live" | "devotions" | "community" | "events";

export type PremiumHomeV4Tile = {
  id: PremiumHomeV4TileId;
  label: string;
  href: string;
  image: string;
  imageClass?: string;
};

export const premiumHomeV4QuickTiles: PremiumHomeV4Tile[] = [
  {
    id: "live",
    label: "Worship Live",
    href: "/live",
    image: "/home/home-gallery-88.jpg",
    imageClass: "object-[center_28%]",
  },
  {
    id: "devotions",
    label: "Daily Devotions",
    href: "/devotions",
    image: premiumV4DevotionsBibleImage,
    imageClass: "object-center",
  },
  {
    id: "community",
    label: "Community",
    href: "/community",
    image: "/home/home-gallery-20.jpg",
    imageClass: "object-[center_40%]",
  },
  {
    id: "events",
    label: "Events",
    href: "/calendar",
    image: "/home/home-gallery-21.jpg",
    imageClass: "object-center",
  },
];

export function premiumV4ServiceChip(campusLabel?: string) {
  const sunday =
    site.serviceTimes.find((row) => row.day.toLowerCase().includes("sunday")) ??
    site.serviceTimes[0];
  const time = sunday.time.split("–")[0]?.trim() ?? "10:00 AM";
  const campus = campusLabel?.trim() || "Aurora";
  return `Sunday ${time} · ${campus}`;
}

export function premiumV4HomeGreeting(firstName?: string | null) {
  if (!firstName?.trim()) return null;
  const hour = new Date().getHours();
  const time =
    hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  return `${time}, ${firstName.trim().split(/\s+/)[0]}`;
}
