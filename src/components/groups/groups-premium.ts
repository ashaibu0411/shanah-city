import { editorialPremium } from "@/components/app/editorial-premium";
import { chatPremium } from "@/components/chat/chat-premium";

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
  chatPanel: chatPremium.panel,
  chatHeader: chatPremium.groupHeader,
  chatDatePill: chatPremium.datePill,
  chatStatusBanner: chatPremium.statusBanner,
  chatComposerWrap: chatPremium.composerBar,
  chatMenu: chatPremium.overflowMenu,
  chatMenuItem: chatPremium.overflowMenuItem,
  chatHeaderTitle: chatPremium.headerTitle,
  chatHeaderSubtitle: chatPremium.headerSubtitle,
  chatHeaderIconButton: chatPremium.headerIconButton,
  chatHeaderAvatarRing: chatPremium.headerAvatarRing,
} as const;
