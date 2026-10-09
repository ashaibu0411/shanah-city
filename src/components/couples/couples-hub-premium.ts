import { editorialPremium } from "@/components/app/editorial-premium";

/** Shanah Couples Hub — dark, card-forward layout aligned with product mockups. */
export const couplesHubPremium = {
  page: "couples-hub-page min-w-0 font-sans text-[var(--couples-text)]",
  inset: "mx-auto w-full max-w-lg px-4 pb-28 pt-2",
  screenTitle: "font-display text-2xl font-semibold tracking-tight text-[var(--couples-text)]",
  screenSubtitle: "mt-1 text-sm leading-relaxed text-[var(--couples-text-muted)]",
  backLink:
    "inline-flex items-center gap-1 text-sm font-semibold text-[var(--couples-text-muted)] transition hover:text-[var(--couples-text)]",
  heroWrap:
    "relative -mx-4 mb-6 overflow-hidden rounded-b-[1.75rem] sm:mx-0 sm:rounded-[1.75rem]",
  heroImage: "object-cover",
  heroOverlay:
    "absolute inset-0 bg-gradient-to-t from-[#0e0e14] via-[#0e0e14]/55 to-[#0e0e14]/15",
  heroContent: "absolute inset-x-0 bottom-0 p-5 pb-6",
  heroTitle: "font-display text-3xl font-semibold tracking-tight text-white",
  heroTagline: "mt-2 text-sm leading-relaxed text-white/85",
  heroEyebrow: "text-[10px] font-bold uppercase tracking-[0.28em] text-rose-200/90",
  sectionTitle: editorialPremium.sectionTitle,
  sectionEyebrow: "text-[10px] font-bold uppercase tracking-[0.28em] text-rose-300/80",
  tileGrid: "grid grid-cols-2 gap-3",
  tileMarriage:
    "couples-hub-tile couples-hub-tile-marriage flex min-h-[7.25rem] flex-col items-center justify-center gap-2 rounded-[1.35rem] p-4 text-center transition active:scale-[0.98]",
  tile:
    "couples-hub-tile flex min-h-[7rem] flex-col justify-between rounded-[1.25rem] border border-white/10 bg-[var(--couples-surface)] p-4 text-left transition active:scale-[0.98] hover:border-white/15",
  tileEmoji: "text-3xl leading-none",
  tileTitle: "font-display text-[0.9rem] font-semibold leading-snug tracking-tight text-[var(--couples-text)]",
  tileTitleMarriage: "font-display text-[0.82rem] font-semibold leading-snug text-[var(--couples-text)]",
  tileSubtitle: "mt-1 text-xs leading-relaxed text-[var(--couples-text-muted)]",
  gateCard:
    "rounded-[1.25rem] border border-dashed border-rose-400/30 bg-[var(--couples-surface)] p-5 text-sm leading-relaxed text-[var(--couples-text-muted)]",
  marriageCta:
    "inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#5a3d2e] to-[#8b5a2b] px-4 py-3.5 text-sm font-semibold text-white shadow-lg shadow-black/30 transition hover:brightness-110 active:scale-[0.99]",
  communityCta:
    "inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#5c2328] to-[#7a2f38] px-4 py-3.5 text-sm font-semibold text-white shadow-lg shadow-black/30 transition hover:brightness-110 active:scale-[0.99]",
  primaryCta:
    "inline-flex w-full items-center justify-center rounded-2xl bg-gradient-to-r from-[#5a3d2e] to-[#8b5a2b] px-4 py-3.5 text-sm font-semibold text-white shadow-md transition hover:brightness-110 active:scale-[0.99]",
  secondaryCta:
    "inline-flex w-full items-center justify-center rounded-2xl border border-white/12 bg-[var(--couples-surface)] px-4 py-3.5 text-sm font-semibold text-[var(--couples-text)] transition hover:border-white/20 active:scale-[0.99]",
  tabPill:
    "rounded-full px-3.5 py-1.5 text-xs font-semibold capitalize transition",
  tabPillActive: "bg-white text-[#0e0e14]",
  tabPillIdle: "bg-[var(--couples-surface)] text-[var(--couples-text-muted)] ring-1 ring-white/10",
  card:
    "rounded-[1.25rem] border border-white/10 bg-[var(--couples-surface)] p-4",
  input:
    "w-full rounded-xl border border-white/12 bg-[#14141c] px-3 py-2.5 text-sm text-[var(--couples-text)] placeholder:text-[var(--couples-text-muted)]",
  progressTrack: "h-2 overflow-hidden rounded-full bg-white/10",
  progressFill: "h-full rounded-full bg-gradient-to-r from-rose-400 to-amber-400",
  fab:
    "fixed bottom-24 right-4 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-[#0e0e14] text-2xl text-white shadow-xl ring-2 ring-white/15",
};

export const COUPLES_HUB_HERO_IMAGE = "/home/home-gallery-12.jpg";
export const COUPLES_DEVOTIONAL_HERO = "/home/home-gallery-06.jpg";
export const COUPLES_DATE_NIGHT_HERO = "/home/home-gallery-15.jpg";
