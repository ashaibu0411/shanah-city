import { site } from "@/lib/site";
import {
  premiumV4DevotionsBibleImage,
  premiumV4HeroMountainImage,
  premiumV4HomeGreeting,
  premiumV4ServiceChip,
} from "@/lib/home-premium-v4";

/** Approved Premium Home V3 — deep indigo, violet, warm gold */
export const premiumHomeV3Tokens = {
  midnight: "#09011a",
  background: "#130134",
  indigo: "#130135",
  deepViolet: "#1d0248",
  purpleSurface: "#301060",
  electricViolet: "#8a35e8",
  magenta: "#d63dad",
  gold: "#f6c66b",
  goldBright: "#ffd978",
  goldDeep: "#bc812e",
  textPrimary: "#fff8ef",
  textSecondary: "#c9c1dc",
} as const;

export {
  premiumV4HeroMountainImage as premiumV3HeroMountainImage,
  premiumV4HomeGreeting as premiumV3HomeGreeting,
  premiumV4ServiceChip as premiumV3ServiceChip,
};

export type PremiumHomeV3TileId = "live" | "devotions" | "events" | "connected";

export type PremiumHomeV3Tile = {
  id: PremiumHomeV3TileId;
  label: string;
  href: string;
  image: string;
  imageClass?: string;
};

/** Get Connected replaces the former Community quick tile on Home V3. */
export const premiumHomeV3QuickTiles: PremiumHomeV3Tile[] = [
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
    id: "events",
    label: "Events",
    href: "/calendar",
    image: "/home/home-gallery-21.jpg",
    imageClass: "object-center",
  },
  {
    id: "connected",
    label: "Get Connected",
    href: "/community",
    image: "/home/home-gallery-20.jpg",
    imageClass: "object-[center_40%]",
  },
];

export function premiumV3BottomNavTabs() {
  const media = site.nav.find((item) => item.href === "/live") ?? site.nav[1];
  return [site.nav[0], site.nav[2], media] as const;
}
