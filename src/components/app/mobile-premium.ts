import { editorialPremium } from "@/components/app/editorial-premium";

export type MobilePremiumActionId = "give" | "connect" | "community" | "calendar";

export const mobilePremiumExploreActions = [
  { id: "give" as const, href: "/give" },
  { id: "connect" as const, href: "/connect" },
  { id: "community" as const, href: "/community" },
  { id: "calendar" as const, href: "/calendar" },
] as const;

export const mobilePremiumActions: Record<
  MobilePremiumActionId,
  {
    label: string;
    detail: string;
    overlay: string;
    accent: string;
    iconTone: string;
  }
> = {
  give: {
    label: "Give",
    detail: "Support ministry",
    overlay: "from-night-950/88 via-night-900/40 to-clay-900/15",
    accent: "from-clay-400/25 to-transparent",
    iconTone: "bg-night-950/30 text-white ring-white/20",
  },
  connect: {
    label: "Connect",
    detail: "Plan a visit",
    overlay: "from-night-950/88 via-clay-950/25 to-night-900/10",
    accent: "from-clay-400/20 to-transparent",
    iconTone: "bg-clay-600/25 text-clay-50 ring-clay-300/30",
  },
  community: {
    label: "Community",
    detail: "See what's new",
    overlay: "from-night-950/86 via-night-900/32 to-clay-900/12",
    accent: "from-clay-300/18 to-transparent",
    iconTone: "bg-night-900/25 text-white ring-white/15",
  },
  calendar: {
    label: "Calendar",
    detail: "Events & RSVP",
    overlay: "from-night-950/88 via-night-900/32 to-clay-900/10",
    accent: "from-clay-400/18 to-transparent",
    iconTone: "bg-night-900/24 text-white ring-white/15",
  },
};

export const mobileActionTones = [
  "from-night-800 to-night-950",
  "from-night-900 to-night-950",
  "from-clay-800 to-night-950",
  "from-night-800 to-clay-900",
] as const;

export function mobileActionTone(index: number) {
  return mobileActionTones[index % mobileActionTones.length];
}

/** Back-compat alias — editorial tokens used app-wide. */
export const premiumTeal = {
  primaryButton: editorialPremium.primaryButton,
  navActive: editorialPremium.navActive,
  navIdle: editorialPremium.navIdle,
  tabActive: editorialPremium.tabActive,
  tabIdle: editorialPremium.tabIdle,
} as const;

/** Shared active/idle pill classes for segmented controls app-wide. */
export function premiumTabPill(active: boolean, className = "") {
  return `${active ? editorialPremium.tabActive : editorialPremium.tabIdle} ${className}`.trim();
}
