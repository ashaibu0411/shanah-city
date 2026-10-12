import { addDaysToDateKey, getZonedDateParts } from "@/lib/denver-time";

export const CHOIR_TIME_ZONE = "America/Denver";

export function normalizeIsoDateKey(input: string): string | null {
  const trimmed = input.trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return null;
  const [year, month, day] = trimmed.split("-").map(Number);
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  return trimmed;
}

export function compareIsoDateKeys(left: string, right: string) {
  return left.localeCompare(right);
}

export function eachIsoDateKeyInRange(startDate: string, endDate: string) {
  const keys: string[] = [];
  let cursor = startDate;
  while (compareIsoDateKeys(cursor, endDate) <= 0) {
    keys.push(cursor);
    cursor = addDaysToDateKey(cursor, 1);
  }
  return keys;
}

export function formatAmericanDate(isoDateKey: string, timeZone = CHOIR_TIME_ZONE) {
  const normalized = normalizeIsoDateKey(isoDateKey);
  if (!normalized) return isoDateKey;
  const [year, month, day] = normalized.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
  return date.toLocaleDateString("en-US", {
    timeZone,
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function formatAmericanDateRange(startDate: string, endDate: string) {
  if (startDate === endDate) return formatAmericanDate(startDate);
  return `${formatAmericanDate(startDate)} – ${formatAmericanDate(endDate)}`;
}

export function validateUnavailabilityRange(startDate: string, endDate: string): string | null {
  const start = normalizeIsoDateKey(startDate);
  const end = normalizeIsoDateKey(endDate);
  if (!start || !end) {
    return "Choose valid start and end dates (U.S. calendar).";
  }
  if (compareIsoDateKeys(end, start) < 0) {
    return "End date must be on or after the start date.";
  }
  return null;
}

export function isIsoDateInRange(dateKey: string, startDate: string, endDate: string) {
  return compareIsoDateKeys(dateKey, startDate) >= 0 && compareIsoDateKeys(dateKey, endDate) <= 0;
}

export function getDenverTodayDateKey() {
  return getZonedDateParts().dateKey;
}

export function personNamesMatch(a: string, b: string) {
  return a.trim().toLowerCase() === b.trim().toLowerCase();
}

export const TIME_AWAY_REASON_OPTIONS = [
  { id: "vacation", label: "Vacation / personal time" },
  { id: "sick", label: "Sick leave" },
  { id: "travel", label: "Travel" },
  { id: "family", label: "Family obligation" },
  { id: "other", label: "Other" },
] as const;

export type TimeAwayReasonId = (typeof TIME_AWAY_REASON_OPTIONS)[number]["id"];

export function formatTimeAwayReason(reasonId: TimeAwayReasonId, details: string) {
  const label = TIME_AWAY_REASON_OPTIONS.find((option) => option.id === reasonId)?.label ?? "Time away";
  const trimmed = details.trim();
  return trimmed ? `${label} — ${trimmed}` : label;
}
