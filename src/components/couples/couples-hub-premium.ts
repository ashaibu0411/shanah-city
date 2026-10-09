import { editorialPremium } from "@/components/app/editorial-premium";

/** Shanah Couples Hub — dark shell + cream content sheets (product mockups). */
export const couplesHubPremium = {
  page: "couples-hub-page min-w-0 font-sans text-[var(--couples-text)]",
  inset: "mx-auto w-full max-w-lg px-4 pb-28 pt-2",
  titleBar:
    "sticky top-0 z-20 flex items-center gap-2 bg-[var(--couples-bg)] px-3 py-3",
  titleBarBack:
    "flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-2xl font-light text-white transition hover:bg-white/10",
  titleBarHeading:
    "min-w-0 flex-1 truncate text-center font-display text-lg font-semibold text-white",
  titleBarSpacer: "h-10 w-10 shrink-0",
  contentSheet:
    "couples-hub-sheet relative z-10 mx-auto w-full max-w-lg rounded-t-[2rem] bg-[var(--couples-sheet-bg)] px-4 pb-28 pt-5 text-[var(--couples-sheet-text)] shadow-[0_-8px_40px_rgba(0,0,0,0.35)]",
  contentSheetOverlap: "-mt-8",
  sheetSubtitle: "mb-4 text-sm leading-relaxed text-[var(--couples-sheet-muted)]",
  sheetCard: "rounded-2xl border border-stone-200/80 bg-white p-4 shadow-sm",
  sheetListRow:
    "flex w-full items-center gap-3 rounded-2xl border border-stone-200/60 bg-white p-4 text-left shadow-sm transition hover:border-stone-300",
  sheetInput:
    "w-full rounded-xl border border-stone-200 bg-white px-3 py-2.5 text-sm text-[var(--couples-sheet-text)] placeholder:text-stone-400",
  sheetProgressTrack: "h-2 overflow-hidden rounded-full bg-stone-200",
  sheetProgressFill: "h-full rounded-full bg-emerald-600",
  sheetPrimaryCta:
    "inline-flex w-full items-center justify-center rounded-2xl bg-gradient-to-r from-[#5a3d2e] to-[#8b5a2b] px-4 py-3.5 text-sm font-semibold text-white shadow-md transition hover:brightness-110 active:scale-[0.99]",
  sheetTabTrack: "flex gap-1 rounded-full bg-[var(--couples-sheet-tab-track)] p-1",
  sheetTabPill: "flex-1 rounded-full px-3 py-2 text-center text-xs font-semibold capitalize transition",
  sheetTabActive: "bg-white text-stone-900 shadow-sm",
  sheetTabIdle: "text-stone-600",
  sheetTabUnderlineTrack: "flex border-b border-stone-200",
  sheetTabUnderline:
    "flex-1 pb-3 text-center text-sm font-semibold transition",
  sheetTabUnderlineActive: "border-b-2 border-stone-900 text-stone-900",
  sheetTabUnderlineIdle: "text-stone-500",
  sheetStatusOk: "mt-4 rounded-xl bg-emerald-50 px-3 py-2 text-sm text-emerald-900",
  sheetStatusError: "mt-4 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-800",
  sheetStatusInfo:
    "rounded-xl border border-dashed border-stone-300 bg-stone-50 px-4 py-8 text-center text-sm text-stone-600",
  sheetModal:
    "max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl bg-white p-5 shadow-xl",
  sheetFab:
    "fixed bottom-24 right-4 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-stone-900 text-2xl text-white shadow-xl",
  menuPanel:
    "rounded-[1.75rem] bg-white p-4 shadow-lg ring-1 ring-stone-200/80",
  iconCircle: "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-xl",
  gamesHeroBanner:
    "rounded-[1.35rem] bg-gradient-to-b from-violet-400 to-violet-800 p-6 text-center text-white shadow-lg",
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
  tileTitleMarriage:
    "font-display text-[0.82rem] font-semibold leading-snug text-stone-900",
  tileSubtitle: "mt-1 text-xs leading-relaxed text-[var(--couples-text-muted)]",
  gateCard:
    "rounded-[1.25rem] border border-dashed border-rose-400/30 bg-[var(--couples-surface)] p-5 text-sm leading-relaxed text-[var(--couples-text-muted)]",
  marriageCta:
    "flex w-full items-center gap-4 rounded-2xl bg-gradient-to-r from-[#5a3d2e] to-[#8b5a2b] px-4 py-4 text-left text-sm font-semibold text-white shadow-lg shadow-black/30 transition hover:brightness-110 active:scale-[0.99]",
  marriageCtaIcon:
    "flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-black/25 text-xl",
  communityCta:
    "flex w-full items-center gap-4 rounded-2xl bg-gradient-to-r from-[#5c2328] to-[#7a2f38] px-4 py-4 text-left text-sm font-semibold text-white shadow-lg shadow-black/30 transition hover:brightness-110 active:scale-[0.99]",
  communityCtaIcon:
    "flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-black/25 text-xl",
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
  listRow:
    "flex w-full items-center gap-3 rounded-[1.25rem] border border-white/10 bg-[var(--couples-surface)] p-4 text-left transition hover:border-white/18",
  statusOk: "mt-4 rounded-xl bg-emerald-500/15 px-3 py-2 text-sm text-emerald-200",
  statusError: "mt-4 rounded-xl bg-red-500/15 px-3 py-2 text-sm text-red-200",
  statusInfo: "rounded-xl border border-white/10 bg-[var(--couples-surface)] px-3 py-2.5 text-sm text-[var(--couples-text-muted)]",
  modalPanel:
    "max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl border border-white/10 bg-[var(--couples-surface)] p-5 shadow-xl",
};

/** Couples Hub landing hero (praying couple); cropFlyerBranding hides flyer text in the UI. */
export const COUPLES_HUB_HERO_IMAGE = "/couples/couples-hub-hero.jpg";
export const COUPLES_DEVOTIONAL_HERO = "/home/home-gallery-06.jpg";
export const COUPLES_DATE_NIGHT_HERO = "/home/home-gallery-15.jpg";
