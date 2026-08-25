/** Subtle brand tones for mobile tiles — navy + gold accent, not rainbow gradients. */
export const mobileActionTones = [
  "from-night-800 to-night-950",
  "from-night-800 to-slate-900",
  "from-slate-800 to-night-950",
  "from-indigo-950 to-night-950",
] as const;

export function mobileActionTone(index: number) {
  return mobileActionTones[index % mobileActionTones.length];
}
