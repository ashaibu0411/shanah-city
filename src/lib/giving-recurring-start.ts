import { denverWallClockToDate, getZonedDateParts } from "@/lib/denver-time";

export const GIVING_RECURRING_TIMEZONE = "America/Denver";
/** Wall-clock time in Denver when the first recurring charge should run. */
export const GIVING_RECURRING_START_TIME = "09:00";

const DATE_KEY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export function givingTodayDateKey(date = new Date()) {
  return getZonedDateParts(date, GIVING_RECURRING_TIMEZONE).dateKey;
}

export function formatGivingDateKeyForDisplay(dateKey: string) {
  const [year, month, day] = dateKey.split("-").map(Number);
  if (!year || !month || !day) return dateKey;
  return new Date(Date.UTC(year, month - 1, day)).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}

function maxRecurringStartDateKey(fromDateKey: string) {
  const [year, month, day] = fromDateKey.split("-").map(Number);
  const max = new Date(Date.UTC(year + 1, month - 1, day));
  return `${max.getUTCFullYear()}-${String(max.getUTCMonth() + 1).padStart(2, "0")}-${String(max.getUTCDate()).padStart(2, "0")}`;
}

export function normalizeRecurringStartDateInput(value: unknown): string | undefined {
  if (value === undefined || value === null || value === "") {
    return undefined;
  }
  const dateKey = String(value).trim();
  if (!DATE_KEY_PATTERN.test(dateKey)) {
    throw new Error("Choose a valid start date.");
  }
  return dateKey;
}

export function validateRecurringStartDate(dateKey: string, now = new Date()) {
  if (!DATE_KEY_PATTERN.test(dateKey)) {
    throw new Error("Choose a valid start date.");
  }

  const todayKey = givingTodayDateKey(now);
  if (dateKey < todayKey) {
    throw new Error("Start date cannot be in the past.");
  }

  const maxKey = maxRecurringStartDateKey(todayKey);
  if (dateKey > maxKey) {
    throw new Error("Start date must be within the next year.");
  }

  return dateKey;
}

/** Stripe `trial_end` (unix seconds) to delay billing until the chosen start date, or undefined to bill now. */
export function stripeTrialEndForRecurringStart(dateKey: string, now = new Date()) {
  validateRecurringStartDate(dateKey, now);
  const todayKey = givingTodayDateKey(now);
  if (dateKey <= todayKey) {
    return undefined;
  }

  const startInstant = denverWallClockToDate(
    dateKey,
    GIVING_RECURRING_START_TIME,
    GIVING_RECURRING_TIMEZONE,
  );
  const trialEnd = Math.floor(startInstant.getTime() / 1000);
  const minimum = Math.floor(now.getTime() / 1000) + 60 * 60;
  return Math.max(trialEnd, minimum);
}

export function recurringStartSummary(dateKey: string | undefined, now = new Date()) {
  if (!dateKey) {
    return "Your first gift runs when you complete checkout.";
  }
  const todayKey = givingTodayDateKey(now);
  if (dateKey <= todayKey) {
    return "Your first gift runs when you complete checkout.";
  }
  return `First gift scheduled for ${formatGivingDateKeyForDisplay(dateKey)} (${GIVING_RECURRING_START_TIME} Mountain Time).`;
}
