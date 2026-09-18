import { editorialPremium } from "@/components/app/editorial-premium";

/** Groups UI — Levites-style layout with Shanah editorial typography (home + app-wide). */

export const groupsPremium = {
  page: "groups-premium-page min-w-0 bg-sand-50 font-sans dark:bg-[var(--color-bg)]",
  pageInset: "px-4 pb-6 pt-1",
  headerTitle:
    "truncate text-center font-display text-base font-semibold tracking-tight text-night-950 dark:text-sand-100 sm:text-lg",
  headerIconButton:
    "inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/80 text-night-800 ring-1 ring-night-900/10 transition hover:bg-white active:scale-[0.98] dark:bg-[var(--color-surface)] dark:text-sand-100 dark:ring-white/10 dark:hover:bg-[var(--color-bg-soft)]",
  summaryPill:
    "inline-flex items-center rounded-full bg-white px-3 py-1 text-xs font-semibold tracking-tight text-night-700 ring-1 ring-night-900/8 dark:bg-[var(--color-surface)] dark:text-sand-200 dark:ring-white/10",
  summaryPillMuted:
    "inline-flex items-center rounded-full bg-white/70 px-3 py-1 text-xs font-semibold tracking-tight text-night-500 ring-1 ring-night-900/6 dark:bg-[var(--color-surface)] dark:text-sand-400 dark:ring-white/10",
  listRow:
    "groups-premium-list-row flex items-center gap-3 rounded-[1.25rem] border border-night-900/8 bg-white px-3.5 py-3.5 shadow-[0_1px_2px_rgba(45,36,24,0.04),0_8px_24px_rgba(45,36,24,0.05)] transition active:scale-[0.995] hover:shadow-[0_12px_32px_rgba(45,36,24,0.08)] dark:border-white/10 dark:bg-[var(--color-surface)] dark:hover:shadow-[0_12px_32px_rgba(0,0,0,0.25)]",
  iconTile:
    "flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-sand-100 font-display text-sm font-bold text-night-700 ring-1 ring-night-900/8",
  iconTileImage: "h-full w-full object-cover",
  stackCard: editorialPremium.card,
  sectionLabel:
    "editorial-section-label text-[10px] font-bold uppercase tracking-[0.26em] text-night-500",
  listTitle: "font-display text-base font-semibold tracking-tight text-night-950",
  cardTitle: editorialPremium.sectionTitle,
  cardMeta: "max-w-xl text-sm leading-relaxed text-night-600",
  rowInset:
    "flex items-center justify-between gap-3 rounded-2xl bg-sand-50/80 px-3.5 py-3 dark:bg-[var(--color-bg-muted)] dark:ring-1 dark:ring-white/10",
  leaderChip:
    "inline-flex items-center gap-1.5 rounded-full bg-sand-50 px-2.5 py-1 text-xs font-semibold tracking-tight text-night-800 ring-1 ring-night-900/8 dark:bg-[var(--color-bg-soft)] dark:text-sand-200 dark:ring-white/10",
  statusChip:
    "rounded-full border border-night-900/12 bg-white px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.14em] text-night-700 dark:border-white/10 dark:bg-[var(--color-surface)] dark:text-sand-200",
  quickAction:
    "inline-flex min-w-0 flex-1 items-center justify-center gap-2 rounded-2xl bg-sand-50 px-3 py-3 text-sm font-semibold tracking-tight text-night-900 ring-1 ring-night-900/8 transition hover:bg-white active:scale-[0.98] dark:bg-[var(--color-bg-muted)] dark:text-sand-100 dark:ring-white/10 dark:hover:bg-[var(--color-surface)]",
  pillTrack:
    "flex flex-wrap gap-2 overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
  pillActive: editorialPremium.tabActive,
  pillIdle: editorialPremium.tabIdle,
  unreadBadge:
    "inline-flex h-6 min-w-[1.5rem] items-center justify-center rounded-full bg-night-950 px-1.5 text-[11px] font-bold text-white",
  unreadBadgeMuted:
    "inline-flex h-6 min-w-[1.5rem] items-center justify-center rounded-full bg-sand-100 px-1.5 text-[11px] font-bold text-night-400 ring-1 ring-night-900/8",
  chatPanel:
    "group-chat-premium fixed inset-0 z-50 flex min-w-0 max-w-full flex-col overflow-x-hidden bg-white font-sans dark:bg-[var(--color-bg)] lg:relative lg:inset-auto lg:z-auto lg:min-h-[min(720px,calc(100dvh-10rem))] lg:overflow-hidden lg:rounded-[1.5rem] lg:border lg:border-night-900/8 lg:shadow-[0_8px_32px_rgba(45,36,24,0.06)] dark:lg:border-white/10",
  chatHeader:
    "shrink-0 border-b border-night-900/6 bg-white px-4 pb-3 pt-[max(0.5rem,env(safe-area-inset-top))] dark:border-white/10 dark:bg-[var(--color-bg)]",
  chatDatePill:
    "rounded-full bg-black/5 px-3 py-1 text-[11px] font-semibold tracking-tight text-night-600 dark:bg-white/10 dark:text-sand-300",
  chatStatusBanner:
    "shrink-0 bg-white px-4 py-2.5 text-center text-xs font-medium tracking-tight text-night-700 ring-1 ring-inset ring-night-900/8",
  chatComposerWrap:
    "shrink-0 border-t border-night-900/6 bg-white pb-[max(0.25rem,env(safe-area-inset-bottom))] dark:border-white/10 dark:bg-[var(--color-bg)]",
  chatMenu:
    "absolute right-0 top-full z-20 mt-1 min-w-[180px] overflow-hidden rounded-2xl border border-night-900/8 bg-white py-1 text-night-900 shadow-[0_12px_32px_rgba(45,36,24,0.12)]",
  chatMenuItem:
    "block w-full px-4 py-2.5 text-left text-sm font-medium tracking-tight text-night-800 hover:bg-sand-50",
} as const;
