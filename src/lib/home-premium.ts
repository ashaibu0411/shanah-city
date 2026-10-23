import { site } from "@/lib/site";

export type PremiumQuickActionId =
  | "live"
  | "sermons"
  | "events"
  | "groups"
  | "give"
  | "check-in"
  | "prayer"
  | "meetings";

export type PremiumQuickAction = {
  id: PremiumQuickActionId;
  label: string;
  description: string;
  href: string;
  wellClass: string;
};

export const premiumDesktopQuickActions: PremiumQuickAction[] = [
  {
    id: "live",
    label: "Watch Live",
    description: "Join us now",
    href: "/live",
    wellClass: "premium-icon-well--live",
  },
  {
    id: "sermons",
    label: "Sermons",
    description: "Latest messages",
    href: "/sermons",
    wellClass: "premium-icon-well--sermons",
  },
  {
    id: "events",
    label: "Events",
    description: "What's happening",
    href: "/calendar",
    wellClass: "premium-icon-well--events",
  },
  {
    id: "groups",
    label: "Groups",
    description: "Find community",
    href: "/groups",
    wellClass: "premium-icon-well--groups",
  },
  {
    id: "give",
    label: "Give",
    description: "Make an impact",
    href: "/give",
    wellClass: "premium-icon-well--give",
  },
  {
    id: "check-in",
    label: "Check-in",
    description: "We're glad you're here",
    href: "/check-in",
    wellClass: "premium-icon-well--checkin",
  },
];

export const premiumMobileLauncherActions: PremiumQuickAction[] = [
  {
    id: "live",
    label: "Live",
    description: "",
    href: "/live",
    wellClass: "premium-icon-well--live",
  },
  {
    id: "sermons",
    label: "Sermons",
    description: "",
    href: "/sermons",
    wellClass: "premium-icon-well--sermons",
  },
  {
    id: "events",
    label: "Events",
    description: "",
    href: "/calendar",
    wellClass: "premium-icon-well--events",
  },
  {
    id: "groups",
    label: "Groups",
    description: "",
    href: "/groups",
    wellClass: "premium-icon-well--groups",
  },
  {
    id: "give",
    label: "Give",
    description: "",
    href: "/give",
    wellClass: "premium-icon-well--give",
  },
  {
    id: "check-in",
    label: "Check-in",
    description: "",
    href: "/check-in",
    wellClass: "premium-icon-well--checkin",
  },
  {
    id: "prayer",
    label: "Pray",
    description: "",
    href: "/meetings",
    wellClass: "premium-icon-well--prayer",
  },
  {
    id: "meetings",
    label: "More",
    description: "",
    href: "__more__",
    wellClass: "premium-icon-well--more",
  },
];

export function homeTimeGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good Morning";
  if (hour < 17) return "Good Afternoon";
  return "Good Evening";
}

export function homeGreetingEmoji() {
  const hour = new Date().getHours();
  if (hour < 12) return "☀️";
  if (hour < 17) return "🌤️";
  return "🌙";
}

export function homeHeroHeadline(firstName?: string | null) {
  const greeting = homeTimeGreeting();
  if (firstName?.trim()) {
    return `${greeting}, ${firstName.trim().split(/\s+/)[0]}`;
  }
  return "Welcome to Shanah City";
}

export function homeHeroSubcopy(firstName?: string | null) {
  if (firstName?.trim()) {
    return "You belong here.";
  }
  return "A place to belong, grow, and encounter God.";
}

export function homeHeroSupportLine() {
  return `${site.mission} ${site.taglineReference ? `· ${site.taglineReference}` : ""}`.trim();
}

export const premiumStayConnectedImage = "/home/home-gallery-community-tile.jpg";
export const premiumPrayerImage = "/devotions/daily-word-portrait.jpg";
export const premiumGiveImage = "/home/home-gallery-give-tile.jpg";
export const premiumEventFallbackImage = "/home/home-gallery-88.jpg";

export function eventArtworkUrl(event: {
  artworkWideUrl?: string;
  artworkSquareUrl?: string;
  artworkBannerUrl?: string;
}) {
  return (
    event.artworkWideUrl?.trim() ||
    event.artworkBannerUrl?.trim() ||
    event.artworkSquareUrl?.trim() ||
    premiumEventFallbackImage
  );
}
