/** Teal-forward tones for Shanah City Premium UI mobile tiles. */
export const mobileActionTones = [
  "from-teal-600 to-teal-900",
  "from-cyan-600 to-teal-800",
  "from-teal-500 to-cyan-800",
  "from-cyan-700 to-teal-950",
] as const;

export function mobileActionTone(index: number) {
  return mobileActionTones[index % mobileActionTones.length];
}

export const premiumTeal = {
  heroGradient:
    "bg-gradient-to-br from-cyan-500 via-teal-600 to-teal-900",
  pageBackground:
    "bg-gradient-to-b from-cyan-100 via-teal-50 to-sand-50",
  primaryButton:
    "bg-gradient-to-r from-teal-500 to-cyan-500 text-white shadow-lg shadow-teal-900/20 hover:from-teal-600 hover:to-cyan-600",
  navActive:
    "bg-cyan-300 text-teal-950 shadow-app-md ring-1 ring-cyan-100/80",
  navIdle:
    "bg-teal-900/70 text-teal-50 ring-1 ring-white/12",
  tabActive:
    "bg-gradient-to-r from-teal-600 to-cyan-600 text-white shadow-md shadow-teal-900/15",
  tabIdle:
    "bg-white/90 text-teal-900 ring-1 ring-teal-900/10 backdrop-blur-sm",
} as const;
