import { choirCalendarRehearsalsHref } from "@/lib/choir-calendar-links";
import type { ChoirRehearsalView } from "@/lib/choir-dashboard-types";
import { SHANAH_WORSHIP_GROUP_ID } from "@/lib/choir-group-constants";
import { site } from "@/lib/site";
import { combinePlanDateTime } from "@/lib/worship-types";

/** Arizona — fixed MST (no daylight saving). */
export const CHOIR_DEFAULT_REHEARSAL_TIMEZONE = "America/Phoenix";
export const CHOIR_DEFAULT_REHEARSAL_TIME = "18:00";
export const CHOIR_DEFAULT_REHEARSAL_TIME_LABEL = "6:00 PM MST";

const WEEKDAY_TO_INDEX: Record<string, number> = {
  Sun: 0,
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
};

function weekdayIndexInTimeZone(date: Date, timeZone: string) {
  const label = new Intl.DateTimeFormat("en-US", { timeZone, weekday: "short" }).format(date);
  return WEEKDAY_TO_INDEX[label] ?? 0;
}

function dateKeyInTimeZone(date: Date, timeZone: string) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function formatRehearsalDateLabel(dateKey: string, timeZone: string) {
  const date = new Date(`${dateKey}T12:00:00`);
  return date.toLocaleDateString(undefined, {
    weekday: "long",
    month: "short",
    day: "numeric",
    timeZone,
  });
}

/** Next Tuesday 6:00 PM MST (weekly default when leadership has not scheduled another rehearsal). */
export function nextDefaultChoirRehearsal(now = new Date()): ChoirRehearsalView {
  const timeZone = CHOIR_DEFAULT_REHEARSAL_TIMEZONE;

  for (let dayOffset = 0; dayOffset < 14; dayOffset += 1) {
    const probe = new Date(now.getTime() + dayOffset * 86_400_000);
    if (weekdayIndexInTimeZone(probe, timeZone) !== 2) continue;

    const dateKey = dateKeyInTimeZone(probe, timeZone);
    const when = combinePlanDateTime(dateKey, CHOIR_DEFAULT_REHEARSAL_TIME);
    if (when.getTime() < now.getTime() - 3_600_000) continue;

    return {
      id: `default-tuesday-rehearsal-${dateKey}`,
      title: "Weekly worship rehearsal",
      dateLabel: formatRehearsalDateLabel(dateKey, timeZone),
      timeLabel: CHOIR_DEFAULT_REHEARSAL_TIME_LABEL,
      location: site.heroChurchName,
      source: "default-weekly",
      calendarHref: choirCalendarRehearsalsHref(SHANAH_WORSHIP_GROUP_ID),
    };
  }

  const fallbackKey = dateKeyInTimeZone(now, timeZone);
  return {
    id: `default-tuesday-rehearsal-${fallbackKey}`,
    title: "Weekly worship rehearsal",
    dateLabel: formatRehearsalDateLabel(fallbackKey, timeZone),
    timeLabel: CHOIR_DEFAULT_REHEARSAL_TIME_LABEL,
    location: site.heroChurchName,
    source: "default-weekly",
    calendarHref: choirCalendarRehearsalsHref(SHANAH_WORSHIP_GROUP_ID),
  };
}
