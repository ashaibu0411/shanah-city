/** Client hint: server is running post-auth Stripe sync via `after()` — poll profile history briefly. */
export function markGivingHistoryRefreshAfterAuth(payload?: {
  givingStripeSyncAfter?: boolean;
}) {
  if (typeof window === "undefined") return;
  if (!payload?.givingStripeSyncAfter) return;
  window.sessionStorage.setItem("giving-history-refresh", String(Date.now()));
}

export const GIVING_HISTORY_AFTER_AUTH_POLL_MS = [3_000, 10_000, 25_000] as const;
export const GIVING_HISTORY_REFRESH_MAX_AGE_MS = 60_000;
export const GIVING_HISTORY_REFRESH_STORAGE_KEY = "giving-history-refresh";

export function clearGivingHistoryRefreshMarker() {
  if (typeof window === "undefined") return;
  window.sessionStorage.removeItem(GIVING_HISTORY_REFRESH_STORAGE_KEY);
}

export function parseGivingHistoryRefreshStamp(stamp: string | null, nowMs = Date.now()) {
  if (!stamp) {
    return { shouldPoll: false as const };
  }
  const startedMs = Number(stamp);
  if (!Number.isFinite(startedMs)) {
    return { shouldPoll: false as const, invalid: true as const };
  }
  if (nowMs - startedMs > GIVING_HISTORY_REFRESH_MAX_AGE_MS) {
    return { shouldPoll: false as const, expired: true as const, startedMs };
  }
  return { shouldPoll: true as const, startedMs };
}
