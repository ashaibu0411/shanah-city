import { getZonedDateParts, wallClockInTimeZoneToInstant } from "@/lib/denver-time";

/** Default IANA zone for marriage counseling session scheduling (Shanah City Colorado campus). */
export const MARRIAGE_COUNSELING_SCHEDULING_TIMEZONE = "America/Denver";

const NAIVE_DATE_TIME_LOCAL_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d{3})?)?$/;

export type StoredScheduledAtKind = "utc_instant" | "naive_local";

export function classifyStoredScheduledAt(value: string): StoredScheduledAtKind {
  const v = value.trim();
  if (/Z$/i.test(v) || /[+-]\d{2}:?\d{2}$/.test(v)) return "utc_instant";
  if (NAIVE_DATE_TIME_LOCAL_RE.test(v)) return "naive_local";
  return "utc_instant";
}

export function parseDateTimeLocalInTimeZone(
  value: string,
  timeZone: string,
): { ok: true; iso: string; instant: Date } | { ok: false; error: string } {
  const normalized = value.trim().slice(0, 16);
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(normalized)) {
    return { ok: false, error: "Use a valid date and time." };
  }
  const [dateKey, timePart] = normalized.split("T");
  const instant = wallClockInTimeZoneToInstant(dateKey, timePart, timeZone);
  if (!instant || Number.isNaN(instant.getTime())) {
    return {
      ok: false,
      error:
        "That local time is invalid or does not exist in the scheduling timezone (daylight saving transition).",
    };
  }

  const zoned = getZonedDateParts(instant, timeZone);
  const [hours, minutes] = timePart.split(":").map(Number);
  if (zoned.dateKey !== dateKey || zoned.hour !== hours || zoned.minute !== minutes) {
    return {
      ok: false,
      error:
        "That local time is invalid or does not exist in the scheduling timezone (daylight saving transition).",
    };
  }

  return { ok: true, iso: instant.toISOString(), instant };
}

export function normalizeNewSessionScheduledAtInput(input: {
  scheduledAt?: string;
  scheduledAtLocal?: string;
  schedulingTimeZone?: string;
}): { scheduledAt: string; schedulingTimeZone: string } {
  const tz = input.schedulingTimeZone?.trim() || MARRIAGE_COUNSELING_SCHEDULING_TIMEZONE;
  const rawLocal = input.scheduledAtLocal?.trim();

  if (rawLocal) {
    const parsed = parseDateTimeLocalInTimeZone(rawLocal, tz);
    if (!parsed.ok) throw new Error(parsed.error);
    return { scheduledAt: parsed.iso, schedulingTimeZone: tz };
  }

  const rawAt = input.scheduledAt?.trim() ?? "";
  if (!rawAt) throw new Error("Scheduled time is required.");

  if (classifyStoredScheduledAt(rawAt) === "naive_local") {
    const parsed = parseDateTimeLocalInTimeZone(rawAt, tz);
    if (!parsed.ok) throw new Error(parsed.error);
    return { scheduledAt: parsed.iso, schedulingTimeZone: tz };
  }

  const instant = new Date(rawAt);
  if (Number.isNaN(instant.getTime())) throw new Error("Invalid scheduled time.");
  return { scheduledAt: instant.toISOString(), schedulingTimeZone: tz };
}

export function sessionSchedulingTimeZone(record?: { schedulingTimeZone?: string | null } | null) {
  return record?.schedulingTimeZone?.trim() || MARRIAGE_COUNSELING_SCHEDULING_TIMEZONE;
}

/** Parse stored value for comparisons/display without mutating persisted data. */
export function parseStoredSessionScheduledAt(
  stored: string,
  schedulingTimeZone?: string,
): Date | null {
  const tz = schedulingTimeZone?.trim() || MARRIAGE_COUNSELING_SCHEDULING_TIMEZONE;
  const trimmed = stored.trim();
  if (!trimmed) return null;

  if (classifyStoredScheduledAt(trimmed) === "naive_local") {
    const local = trimmed.slice(0, 16);
    const [dateKey, timePart] = local.split("T");
    return wallClockInTimeZoneToInstant(dateKey, timePart, tz);
  }

  const instant = new Date(trimmed);
  return Number.isNaN(instant.getTime()) ? null : instant;
}

export function marriageSessionInstantMs(stored: string, schedulingTimeZone?: string): number {
  return parseStoredSessionScheduledAt(stored, schedulingTimeZone)?.getTime() ?? Number.NaN;
}

export function formatMarriageSessionScheduledAt(
  stored: string,
  schedulingTimeZone?: string,
): string {
  const tz = schedulingTimeZone?.trim() || MARRIAGE_COUNSELING_SCHEDULING_TIMEZONE;
  const instant = parseStoredSessionScheduledAt(stored, tz);
  if (!instant) return stored;

  const formatted = instant.toLocaleString("en-US", {
    timeZone: tz,
    dateStyle: "medium",
    timeStyle: "short",
  });
  const tzLabel = new Intl.DateTimeFormat("en-US", { timeZone: tz, timeZoneName: "short" })
    .formatToParts(instant)
    .find((part) => part.type === "timeZoneName")?.value;
  return tzLabel ? `${formatted} ${tzLabel}` : formatted;
}
