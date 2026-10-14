import { choirCalendarRehearsalsHref } from "@/lib/choir-calendar-links";
import type { ChoirRehearsalView } from "@/lib/choir-dashboard-types";
import { SHANAH_WORSHIP_GROUP_ID } from "@/lib/choir-group-constants";
import { getZonedDateParts } from "@/lib/denver-time";
import { site } from "@/lib/site";
import { combinePlanDateTime } from "@/lib/worship-types";

/** Arizona — fixed MST (no daylight saving). */
export const CHOIR_DEFAULT_REHEARSAL_TIMEZONE = "America/Phoenix";
export const CHOIR_DEFAULT_REHEARSAL_TIME = "18:00";
export const CHOIR_DEFAULT_REHEARSAL_TIME_LABEL = "6:00 PM MST";

function formatRehearsalDateLabel(dateKey: string, zone: string) {
  const [year, month, day] = dateKey.split("-").map(Number);
  const noonUtc = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
  return new Intl.DateTimeFormat("en-US", {
    timeZone: zone,
    weekday: "long",
    month: "short",
    day: "numeric",
  }).format(noonUtc);
}

/** Next Tuesday 6:00 PM MST (weekly default when leadership has not scheduled another rehearsal). */
export function nextDefaultChoirRehearsal(now = new Date()): ChoirRehearsalView {
  const zone = CHOIR_DEFAULT_REHEARSAL_TIMEZONE;

  for (let dayOffset = 0; dayOffset < 14; dayOffset += 1) {
    const probe = new Date(now.getTime() + dayOffset * 86_400_000);
    const parts = getZonedDateParts(probe, zone);
    if (parts.weekday !== 2) continue;

    const when = combinePlanDateTime(parts.dateKey, CHOIR_DEFAULT_REHEARSAL_TIME);
    if (when.getTime() < now.getTime() - 3_600_000) continue;

    return {
      id: `default-tuesday-rehearsal-${parts.dateKey}`,
      title: "Weekly worship rehearsal",
      dateLabel: formatRehearsalDateLabel(parts.dateKey, zone),
      timeLabel: CHOIR_DEFAULT_REHEARSAL_TIME_LABEL,
      location: site.heroChurchName,
      source: "default-weekly",
      calendarHref: choirCalendarRehearsalsHref(SHANAH_WORSHIP_GROUP_ID),
    };
  }

  const fallbackKey = getZonedDateParts(now, zone).dateKey;
  return {
    id: `default-tuesday-rehearsal-${fallbackKey}`,
    title: "Weekly worship rehearsal",
    dateLabel: formatRehearsalDateLabel(fallbackKey, zone),
    timeLabel: CHOIR_DEFAULT_REHEARSAL_TIME_LABEL,
    location: site.heroChurchName,
    source: "default-weekly",
    calendarHref: choirCalendarRehearsalsHref(SHANAH_WORSHIP_GROUP_ID),
  };
}
