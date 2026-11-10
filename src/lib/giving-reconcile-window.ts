const DATE_KEY_RE = /^\d{4}-\d{2}-\d{2}$/;
export const GIVING_RECONCILE_MAX_WINDOW_DAYS = 366;

export type GivingReconcileDateWindow = {
  since: string;
  until: string;
  sinceUnix: number;
  untilUnix: number;
};

export type GivingReconcileDateParseResult =
  | { ok: true; window: GivingReconcileDateWindow }
  | { ok: false; message: string };

function parseDateKeyUtc(dateKey: string) {
  if (!DATE_KEY_RE.test(dateKey)) return null;
  const ms = Date.parse(`${dateKey}T00:00:00.000Z`);
  if (!Number.isFinite(ms)) return null;
  const roundTrip = new Date(ms).toISOString().slice(0, 10);
  if (roundTrip !== dateKey) return null;
  return ms;
}

export function parseGivingReconcileDateWindow(
  sinceInput?: string,
  untilInput?: string,
): GivingReconcileDateParseResult {
  const since = sinceInput?.trim() ?? "";
  const until = untilInput?.trim() ?? "";
  if (!since || !until) {
    return { ok: false, message: "since and until are required (YYYY-MM-DD)." };
  }
  const sinceMs = parseDateKeyUtc(since);
  const untilMs = parseDateKeyUtc(until);
  if (sinceMs === null || untilMs === null) {
    return { ok: false, message: "since and until must be valid ISO calendar dates (YYYY-MM-DD)." };
  }
  if (since > until) {
    return { ok: false, message: "since must be on or before until." };
  }
  const spanDays = Math.floor((untilMs - sinceMs) / 86_400_000) + 1;
  if (spanDays > GIVING_RECONCILE_MAX_WINDOW_DAYS) {
    return {
      ok: false,
      message: `Date window may not exceed ${GIVING_RECONCILE_MAX_WINDOW_DAYS} days.`,
    };
  }
  const sinceUnix = Math.floor(sinceMs / 1000);
  const untilUnix = Math.floor((untilMs + 86_399_999) / 1000);
  return { ok: true, window: { since, until, sinceUnix, untilUnix } };
}
