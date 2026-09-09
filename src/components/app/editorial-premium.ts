/** Levites-inspired editorial tokens — cream surfaces, black pills, terracotta accents. */

export const editorialClay = {
  50: "#faf6f1",
  100: "#f5efe6",
  200: "#e8ddd0",
  400: "#c4a882",
  500: "#b45309",
  600: "#9a3412",
  700: "#7c2d12",
  800: "#6b2a0f",
} as const;

export const editorialPremium = {
  pageHeader:
    "editorial-page-header mb-4 overflow-hidden rounded-[1.35rem] border border-night-900/8 bg-[#f7f3eb] p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_12px_32px_rgba(15,23,42,0.06)]",
  pageEyebrow:
    "editorial-page-eyebrow text-[10px] font-bold uppercase tracking-[0.28em] text-night-500",
  pageTitle:
    "mt-2 font-home-hero text-[1.65rem] font-semibold leading-[1.15] tracking-tight text-night-950 sm:text-[1.85rem]",
  pageDescription: "mt-3 max-w-xl text-sm leading-relaxed text-night-600",
  sectionLabel:
    "editorial-section-label mb-2 text-[10px] font-bold uppercase tracking-[0.26em] text-night-500",
  sectionTitle:
    "editorial-section-title font-display text-lg font-semibold tracking-tight text-night-950 sm:text-xl",
  leadCard:
    "editorial-lead-card rounded-[1.25rem] border border-night-900/8 bg-white/70 p-4 text-sm leading-relaxed text-night-700 shadow-[0_1px_2px_rgba(15,23,42,0.04)] sm:p-5",
  card:
    "editorial-card rounded-[1.25rem] border border-night-900/8 bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_8px_24px_rgba(15,23,42,0.05)] sm:p-5",
  primaryButton:
    "rounded-full bg-night-950 px-5 py-2.5 text-sm font-semibold tracking-tight text-white shadow-[0_8px_24px_rgba(15,23,42,0.18)] transition hover:bg-night-900 active:scale-[0.98]",
  secondaryButton:
    "rounded-full border border-night-900/15 bg-transparent px-5 py-2.5 text-sm font-semibold tracking-tight text-night-900 transition hover:bg-night-950/[0.04] active:scale-[0.98]",
  ghostButton:
    "rounded-full bg-transparent px-4 py-2 text-sm font-semibold text-night-700 transition hover:bg-night-950/[0.04]",
  tabActive:
    "rounded-full bg-night-950 px-4 py-1.5 text-sm font-semibold text-white shadow-[0_6px_18px_rgba(15,23,42,0.16)] transition active:scale-[0.98]",
  tabIdle:
    "rounded-full border border-night-900/12 bg-white/80 px-4 py-1.5 text-sm font-semibold text-night-700 transition active:scale-[0.98]",
  badgeDefault:
    "rounded-full border border-night-900/12 bg-night-950 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.14em] text-white",
  badgeOutline:
    "rounded-full border border-night-900/12 bg-white px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.14em] text-night-700",
  quote:
    "editorial-quote rounded-[1.35rem] border border-night-900/8 bg-white/75 p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_8px_24px_rgba(15,23,42,0.05)] sm:p-6",
  section:
    "editorial-section rounded-[1.35rem] border border-night-900/8 bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_8px_24px_rgba(15,23,42,0.05)] sm:p-6",
  surface:
    "editorial-surface rounded-[1.25rem] border border-night-900/8 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04),0_8px_24px_rgba(15,23,42,0.05)]",
  navActive:
    "bg-night-950 text-white shadow-[0_6px_18px_rgba(15,23,42,0.18)] ring-1 ring-night-900/10",
  navIdle:
    "bg-white/90 text-night-800 ring-1 ring-night-900/10 shadow-sm",
  segmentActive: "bg-night-950 text-white",
  segmentIdle: "text-night-700 hover:bg-white/80",
} as const;

export function formatEditorialSectionLabel(index: number, label: string) {
  return `№ ${String(index).padStart(2, "0")} — ${label}`;
}
