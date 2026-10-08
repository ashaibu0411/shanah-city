import { editorialPremium } from "@/components/app/editorial-premium";

export const couplesHubPremium = {
  page:
    "couples-hub-page min-w-0 bg-gradient-to-b from-rose-50/80 via-sand-50 to-sand-50 font-sans dark:from-[var(--color-bg)] dark:via-[var(--color-bg)] dark:to-[var(--color-bg)]",
  inset: "mx-auto w-full max-w-lg px-4 pb-28 pt-2",
  heroCard:
    "relative overflow-hidden rounded-[1.5rem] border border-rose-200/60 bg-gradient-to-br from-rose-100/90 via-white to-amber-50/80 p-6 shadow-[0_12px_40px_rgba(120,53,45,0.08)] dark:border-rose-900/30 dark:from-rose-950/40 dark:via-[var(--color-surface)] dark:to-[var(--color-bg-soft)]",
  sectionTitle: editorialPremium.sectionTitle,
  sectionEyebrow:
    "text-[10px] font-bold uppercase tracking-[0.28em] text-rose-800/80 dark:text-rose-200/80",
  tileGrid: "grid grid-cols-2 gap-3 sm:gap-3.5",
  tile:
    "couples-hub-tile flex min-h-[7.5rem] flex-col justify-between rounded-[1.25rem] border border-night-900/8 bg-white/95 p-4 text-left shadow-[0_1px_2px_rgba(45,36,24,0.04),0_10px_28px_rgba(45,36,24,0.06)] transition active:scale-[0.98] hover:shadow-[0_14px_36px_rgba(45,36,24,0.09)] dark:border-white/10 dark:bg-[var(--color-surface)]",
  tileEmoji: "text-2xl leading-none",
  tileTitle: "font-display text-[0.95rem] font-semibold leading-snug tracking-tight text-night-950 dark:text-sand-100",
  tileSubtitle: "mt-1 text-xs leading-relaxed text-night-600 dark:text-sand-400",
  gateCard:
    "rounded-[1.25rem] border border-dashed border-rose-300/80 bg-white/70 p-5 text-sm leading-relaxed text-night-700 dark:border-rose-800/50 dark:bg-[var(--color-surface)] dark:text-sand-200",
  primaryCta:
    "inline-flex w-full items-center justify-center rounded-2xl bg-night-900 px-4 py-3.5 text-sm font-semibold text-white shadow-md transition hover:bg-night-800 active:scale-[0.99] dark:bg-sand-100 dark:text-night-950",
  secondaryCta:
    "inline-flex w-full items-center justify-center rounded-2xl bg-white px-4 py-3.5 text-sm font-semibold text-night-900 ring-1 ring-night-900/10 transition hover:bg-sand-50 active:scale-[0.99] dark:bg-[var(--color-surface)] dark:text-sand-100 dark:ring-white/10",
};
