/** Client hint: server is running post-auth Stripe sync via `after()` — poll profile history briefly. */
export function markGivingHistoryRefreshAfterAuth(payload?: {
  givingStripeSyncAfter?: boolean;
}) {
  if (typeof window === "undefined") return;
  if (!payload?.givingStripeSyncAfter) return;
  window.sessionStorage.setItem("giving-history-refresh", String(Date.now()));
}

export const GIVING_HISTORY_AFTER_AUTH_POLL_MS = [3_000, 10_000, 25_000] as const;
