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
