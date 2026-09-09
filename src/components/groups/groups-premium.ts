/** Levites-style groups architecture — Shanah editorial colors (cream / black / clay). */

export const groupsPremium = {
  page: "groups-premium-page min-w-0 bg-[#f7f3eb]",
  pageInset: "px-4 pb-6 pt-1",
  headerTitle:
    "truncate text-center text-base font-semibold tracking-tight text-night-950 sm:text-lg",
  headerIconButton:
    "inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/80 text-night-800 ring-1 ring-night-900/10 transition hover:bg-white active:scale-[0.98]",
  summaryPill:
    "inline-flex items-center rounded-full bg-white px-3 py-1 text-xs font-semibold text-night-700 ring-1 ring-night-900/8",
  summaryPillMuted:
    "inline-flex items-center rounded-full bg-white/70 px-3 py-1 text-xs font-semibold text-night-500 ring-1 ring-night-900/6",
  listRow:
    "groups-premium-list-row flex items-center gap-3 rounded-[1.25rem] border border-night-900/8 bg-white px-3.5 py-3.5 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_8px_24px_rgba(15,23,42,0.05)] transition active:scale-[0.995] hover:shadow-[0_12px_32px_rgba(15,23,42,0.08)]",
  iconTile:
    "flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-[#f3efe8] text-sm font-bold text-night-700 ring-1 ring-night-900/8",
  iconTileImage: "h-full w-full object-cover",
  stackCard:
    "rounded-[1.35rem] border border-night-900/8 bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_8px_24px_rgba(15,23,42,0.05)] sm:p-5",
  sectionLabel:
    "text-[10px] font-bold uppercase tracking-[0.28em] text-night-500",
  cardTitle: "text-lg font-semibold tracking-tight text-night-950",
  cardMeta: "text-sm text-night-500",
  rowInset:
    "flex items-center justify-between gap-3 rounded-2xl bg-[#f7f3eb]/80 px-3.5 py-3",
  leaderChip:
    "inline-flex items-center gap-1.5 rounded-full bg-[#f7f3eb] px-2.5 py-1 text-xs font-semibold text-night-800 ring-1 ring-night-900/8",
  statusChip:
    "inline-flex items-center gap-1 rounded-full bg-[#f7f3eb] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-night-700 ring-1 ring-night-900/8",
  quickAction:
    "inline-flex min-w-0 flex-1 items-center justify-center gap-2 rounded-2xl bg-[#f7f3eb] px-3 py-3 text-sm font-semibold text-night-900 ring-1 ring-night-900/8 transition hover:bg-white active:scale-[0.98]",
  pillTrack:
    "flex gap-1 overflow-x-auto rounded-full bg-white/70 p-1 ring-1 ring-night-900/8 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
  pillButton:
    "shrink-0 rounded-full px-4 py-2.5 text-sm font-semibold transition active:scale-[0.98]",
  pillActive: "bg-night-950 text-white shadow-[0_6px_18px_rgba(15,23,42,0.16)]",
  pillIdle: "text-night-600 hover:bg-white/80 hover:text-night-900",
  unreadBadge:
    "inline-flex h-6 min-w-[1.5rem] items-center justify-center rounded-full bg-night-950 px-1.5 text-[11px] font-bold text-white",
  unreadBadgeMuted:
    "inline-flex h-6 min-w-[1.5rem] items-center justify-center rounded-full bg-[#f3efe8] px-1.5 text-[11px] font-bold text-night-400 ring-1 ring-night-900/8",
  chatPanel:
    "group-chat-premium fixed inset-0 z-50 flex min-w-0 flex-col bg-[#f7f3eb] lg:relative lg:inset-auto lg:z-auto lg:min-h-[min(720px,calc(100dvh-10rem))] lg:overflow-hidden lg:rounded-[1.5rem] lg:border lg:border-night-900/8 lg:shadow-[0_8px_32px_rgba(15,23,42,0.06)]",
  chatHeader:
    "shrink-0 border-b border-night-900/8 bg-white/95 px-4 pb-3 pt-[max(0.5rem,env(safe-area-inset-top))] backdrop-blur-sm",
  chatDatePill:
    "rounded-full bg-white px-3 py-1 text-[11px] font-semibold text-night-500 shadow-sm ring-1 ring-night-900/8",
  chatStatusBanner:
    "shrink-0 bg-white px-4 py-2.5 text-center text-xs font-medium text-night-700 ring-1 ring-inset ring-night-900/8",
  chatComposerWrap:
    "shrink-0 border-t border-night-900/8 bg-white/95 pb-[max(0.25rem,env(safe-area-inset-bottom))] backdrop-blur-sm",
  chatMenu:
    "absolute right-0 top-full z-20 mt-1 min-w-[180px] overflow-hidden rounded-2xl border border-night-900/8 bg-white py-1 text-night-900 shadow-[0_12px_32px_rgba(15,23,42,0.12)]",
  chatMenuItem:
    "block w-full px-4 py-2.5 text-left text-sm font-medium text-night-800 hover:bg-[#f7f3eb]",
} as const;
