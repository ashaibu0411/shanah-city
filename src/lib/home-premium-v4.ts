import { homeExploreTileImages } from "@/lib/home-explore-tile-images";
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

export type PremiumHomeV4TileId = "live" | "devotions" | "community" | "events";

export type PremiumHomeV4Tile = {
  id: PremiumHomeV4TileId;
  label: string;
  href: string;
  image: string;
};

export const premiumHomeV4QuickTiles: PremiumHomeV4Tile[] = [
  {
    id: "live",
    label: "Worship Live",
    href: "/live",
    image: "/home/home-gallery-88.jpg",
  },
  {
    id: "devotions",
    label: "Daily Devotions",
    href: "/devotions",
    image: "/devotions/daily-word-portrait.jpg",
  },
  {
    id: "community",
    label: "Community",
    href: "/community",
    image: homeExploreTileImages.community,
  },
  {
    id: "events",
    label: "Events",
    href: "/calendar",
    image: homeExploreTileImages.calendar,
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
