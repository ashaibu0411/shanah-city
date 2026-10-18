import { editorialPremium } from "@/components/app/editorial-premium";

export const marriagePremium = {
  page: "marriage-counseling-page min-w-0 max-w-[430px] mx-auto text-night-900 dark:text-sand-100",
  /** Side-by-side compare + temperament snapshot — comfortable desktop reading width. */
  comparePage:
    "marriage-counseling-page min-w-0 w-full max-w-[1040px] mx-auto text-night-900 dark:text-sand-100",
  inset: "px-4 pb-28 pt-2 safe-bottom",
  compareInset: "px-4 sm:px-6 lg:px-8 pb-28 pt-2 safe-bottom",
  hero:
    "rounded-[1.75rem] bg-gradient-to-br from-rose-950 via-night-900 to-clay-900 p-6 text-white shadow-lg ring-1 ring-white/10",
  heroTitle: "font-display text-2xl font-semibold tracking-tight",
  heroLead: "mt-2 text-sm leading-relaxed text-white/85",
  card: "rounded-2xl border border-night-900/8 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-[var(--color-surface)]",
  cardMuted: "text-sm text-night-600 dark:text-sand-400",
  sectionLabel: "text-xs font-bold uppercase tracking-[0.2em] text-clay-700 dark:text-clay-300",
  primaryCta: `${editorialPremium.primaryButton} w-full min-h-[44px] justify-center py-3.5 text-sm font-semibold`,
  secondaryCta:
    "inline-flex w-full min-h-[44px] items-center justify-center rounded-full border border-night-900/12 bg-white px-4 py-3 text-sm font-semibold text-night-800 dark:border-white/15 dark:bg-[var(--color-bg-muted)] dark:text-sand-100",
  progressTrack: "h-2 overflow-hidden rounded-full bg-night-900/10 dark:bg-white/10",
  progressFill: "h-full rounded-full bg-clay-600",
  moduleRow:
    "flex w-full min-h-[44px] items-center gap-3 rounded-2xl border border-night-900/8 bg-white p-4 text-left transition active:scale-[0.99] dark:border-white/10 dark:bg-[var(--color-surface)]",
  questionCard:
    "rounded-2xl border border-night-900/8 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-[var(--color-surface)]",
  optionBtn:
    "flex min-h-[44px] w-full items-center rounded-xl border border-night-900/10 px-4 py-3 text-left text-sm font-medium transition dark:border-white/12",
  optionActive: "border-clay-600 bg-clay-50 ring-2 ring-clay-500/30 dark:bg-clay-950/40",
  badgeAligned: "rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-900",
  badgeDifferent: "rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-950",
  badgeTalk: "rounded-full bg-sky-100 px-2 py-0.5 text-xs font-semibold text-sky-950",
} as const;
