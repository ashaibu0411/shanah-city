import { getDatesInMonth, isPrivateChurchCalendarEvent } from "@/lib/calendar-utils";
import { getZonedDateParts } from "@/lib/denver-time";
import type { ChurchEvent } from "@/lib/types";

export type HomeUpcomingEventRow = {
  event: ChurchEvent;
  /** Next occurrence in America/Denver (yyyy-mm-dd). */
  occurrenceDate: string;
};

function denverTodayKey() {
  return getZonedDateParts(new Date(), "America/Denver").dateKey;
}

export function parseChurchEventDay(event: ChurchEvent): Date | null {
  const raw = event.startsOn?.trim() || event.date?.trim();
  if (!raw) return null;
  if (/^\d{4}-\d{2}-\d{2}/.test(raw)) {
    const parsed = new Date(`${raw.slice(0, 10)}T12:00:00`);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }
  const parsed = new Date(raw);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function nextOccurrenceDate(event: ChurchEvent, todayKey: string): string | null {
  const [startYear, startMonth] = todayKey.split("-").map(Number);
  let best: string | null = null;

  for (let offset = 0; offset < 4; offset += 1) {
    const cursor = new Date(startYear, startMonth - 1 + offset, 1);
    const dates = getDatesInMonth(event, cursor.getFullYear(), cursor.getMonth())
      .filter((iso) => iso >= todayKey)
      .sort();
    if (dates[0] && (!best || dates[0] < best)) {
      best = dates[0];
    }
  }

  if (best) return best;

  const fallback = parseChurchEventDay(event);
  if (!fallback) return null;
  const iso = `${fallback.getFullYear()}-${String(fallback.getMonth() + 1).padStart(2, "0")}-${String(fallback.getDate()).padStart(2, "0")}`;
  return iso >= todayKey ? iso : null;
}

/** Next occurrences for the home list — matches church calendar logic (Denver dates). */
export function pickUpcomingHomeEventRows(events: ChurchEvent[], limit = 3): HomeUpcomingEventRow[] {
  const todayKey = denverTodayKey();
  const rows: HomeUpcomingEventRow[] = [];

  for (const event of events) {
    if (event.published === false) continue;
    if (isPrivateChurchCalendarEvent(event)) continue;
    const occurrenceDate = nextOccurrenceDate(event, todayKey);
    if (occurrenceDate) {
      rows.push({ event, occurrenceDate });
    }
  }

  return rows
    .sort((a, b) => a.occurrenceDate.localeCompare(b.occurrenceDate))
    .slice(0, limit);
}

/** @deprecated Use pickUpcomingHomeEventRows — kept for any legacy callers. */
export function pickUpcomingPublishedEvents(events: ChurchEvent[], limit = 3) {
  return pickUpcomingHomeEventRows(events, limit).map((row) => row.event);
}

export function formatHomeEventMeta(event: ChurchEvent, occurrenceDate?: string) {
  const day = occurrenceDate
    ? new Date(`${occurrenceDate}T12:00:00`)
    : parseChurchEventDay(event);
  const dateLabel = day
    ? day.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })
    : event.date || "Date TBA";
  const meta = [dateLabel, event.time].filter(Boolean).join(" · ");
  return { day, dateLabel, meta };
}
