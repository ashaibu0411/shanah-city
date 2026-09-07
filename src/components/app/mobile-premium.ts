/** Soft church-modern tones for Shanah City Premium UI (warm sand + navy, teal accents). */
export const mobileActionTones = [
  "from-night-800 to-night-950",
  "from-night-800 to-teal-900",
  "from-teal-800 to-night-950",
  "from-slate-800 to-teal-900",
] as const;

export function mobileActionTone(index: number) {
  return mobileActionTones[index % mobileActionTones.length];
}

/** Mobile accent tokens — teal on actions, gold on nav, navy heroes. */
export const premiumTeal = {
  primaryButton:
    "bg-teal-700 text-white shadow-md shadow-teal-900/20 hover:bg-teal-800",
  navActive:
    "bg-amber-400 text-night-950 shadow-app-md ring-1 ring-amber-200/60",
  navIdle:
    "bg-night-800 text-sand-100 ring-1 ring-white/15",
  tabActive:
    "bg-teal-700 text-white shadow-md shadow-teal-900/20 ring-1 ring-teal-600/25",
  tabIdle:
    "bg-white text-night-700 ring-1 ring-night-900/10",
} as const;

export type MobilePremiumActionId = "give" | "connect" | "community" | "devotions";

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
    overlay: "from-teal-950/88 via-teal-900/35 to-teal-800/15",
    accent: "from-teal-400/30 to-transparent",
    iconTone: "bg-teal-500/25 text-teal-100 ring-teal-300/35",
  },
  connect: {
    label: "Connect",
    detail: "Plan a visit",
    overlay: "from-night-950/88 via-amber-950/30 to-night-900/10",
    accent: "from-amber-400/25 to-transparent",
    iconTone: "bg-amber-500/25 text-amber-100 ring-amber-300/35",
  },
  community: {
    label: "Community",
    detail: "See what's new",
    overlay: "from-night-950/86 via-cyan-950/28 to-teal-900/12",
    accent: "from-cyan-400/22 to-transparent",
    iconTone: "bg-cyan-500/22 text-cyan-50 ring-cyan-300/30",
  },
  devotions: {
    label: "Devotions",
    detail: "Daily word",
    overlay: "from-night-950/88 via-amber-950/25 to-night-900/12",
    accent: "from-amber-300/20 to-transparent",
    iconTone: "bg-amber-400/20 text-amber-50 ring-amber-200/30",
  },
};

export const mobilePremiumExploreActions = [
  { id: "give" as const, href: "/give" },
  { id: "connect" as const, href: "/connect" },
  { id: "community" as const, href: "/community" },
  { id: "devotions" as const, href: "/devotions" },
];
