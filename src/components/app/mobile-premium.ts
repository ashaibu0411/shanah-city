export const mobileActionTones = [
  "from-violet-600 via-purple-600 to-fuchsia-700 shadow-violet-500/30",
  "from-sky-500 via-blue-600 to-indigo-700 shadow-blue-500/30",
  "from-emerald-500 via-teal-500 to-cyan-600 shadow-emerald-500/30",
  "from-amber-500 via-orange-500 to-rose-600 shadow-amber-500/30",
  "from-rose-500 via-pink-600 to-fuchsia-700 shadow-rose-500/30",
  "from-indigo-500 via-violet-600 to-purple-700 shadow-indigo-500/30",
  "from-cyan-500 via-sky-600 to-blue-700 shadow-cyan-500/30",
  "from-orange-500 via-amber-500 to-yellow-600 shadow-orange-500/30",
] as const;

export function mobileActionTone(index: number) {
  return mobileActionTones[index % mobileActionTones.length];
}
