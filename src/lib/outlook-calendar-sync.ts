import { site } from "@/lib/site";
import type { ChurchEvent } from "@/lib/types";
import { deleteEvent, getEvents, upsertEvent } from "@/lib/event-server";
import { isOutlookSyncedEventId } from "@/lib/calendar-utils";
import {
  outlookEventId,
  parseIcsEvents,
  parseRruleMonthlyNthWeekday,
  parseRruleUntilDate,
  parseRruleWeekdays,
  type ParsedIcsDate,
  type ParsedIcsEvent,
} from "@/lib/ics";

const WEEKDAY_LABELS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
] as const;

function getOutlookCalendarIcsUrl() {
  return process.env.OUTLOOK_CALENDAR_ICS_URL?.trim() || "";
}

export function isOutlookCalendarConfigured() {
  return Boolean(getOutlookCalendarIcsUrl());
}

function formatClock(hour: number, minute: number) {
  const period = hour >= 12 ? "PM" : "AM";
  const hour12 = hour % 12 || 12;
  return `${hour12}:${String(minute).padStart(2, "0")} ${period}`;
}

function formatFriendlyDate(dateKey: string) {
  const [year, month, day] = dateKey.split("-").map(Number);
  return new Date(year, month - 1, day).toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatTimeRange(start: ParsedIcsDate, end: ParsedIcsDate | null) {
  if (start.dateOnly) return "All day";
  if (!end || end.dateOnly || end.dateKey !== start.dateKey) {
    return formatClock(start.hour, start.minute);
  }
  if (end.hour === start.hour && end.minute === start.minute) {
    return formatClock(start.hour, start.minute);
  }
  return `${formatClock(start.hour, start.minute)} – ${formatClock(end.hour, end.minute)}`;
}

function churchEventFromOutlook(
  parsed: ParsedIcsEvent,
  options?: { weekday?: number; idSuffix?: string },
): ChurchEvent {
  const weekday = options?.weekday;
  const monthlyWeekday = parseRruleMonthlyNthWeekday(parsed.rrule);
  const until = parseRruleUntilDate(parsed.rrule);
  const location = parsed.location.trim() || site.address;

  if (monthlyWeekday != null) {
    return {
      id: outlookEventId(parsed.uid, options?.idSuffix),
      title: parsed.summary,
      date: `First ${WEEKDAY_LABELS[monthlyWeekday]}`,
      time: formatTimeRange(parsed.start, parsed.end),
      location,
      published: true,
      sortOrder: 20,
    };
  }

  if (weekday != null) {
    return {
      id: outlookEventId(parsed.uid, options?.idSuffix ?? WEEKDAY_LABELS[weekday].slice(0, 2)),
      title: parsed.summary,
      date: `Every ${WEEKDAY_LABELS[weekday]}`,
      time: formatTimeRange(parsed.start, parsed.end),
      location,
      startsOn: parsed.start.dateKey,
      endsOn: until,
      recurringWeekday: weekday,
      published: true,
      sortOrder: 10,
    };
  }

  return {
    id: outlookEventId(parsed.uid, options?.idSuffix),
    title: parsed.summary,
    date: formatFriendlyDate(parsed.start.dateKey),
    time: formatTimeRange(parsed.start, parsed.end),
    location,
    startsOn: parsed.start.dateKey,
    endsOn: parsed.end && !parsed.end.dateOnly ? parsed.end.dateKey : parsed.start.dateKey,
    published: true,
    sortOrder: 30,
  };
}

function toChurchEvents(parsed: ParsedIcsEvent) {
  if (parsed.cancelled || !parsed.summary.trim()) return [] as ChurchEvent[];
  // Outlook publishes both the series master and each occurrence. Keep the master.
  if (parsed.recurrenceId) return [];

  const monthlyWeekday = parseRruleMonthlyNthWeekday(parsed.rrule);
  if (monthlyWeekday != null) {
    return [churchEventFromOutlook(parsed)];
  }

  const weekdays = parseRruleWeekdays(parsed.rrule);
  if (weekdays.length > 0) {
    return weekdays.map((weekday) =>
      churchEventFromOutlook(parsed, {
        weekday,
        idSuffix: WEEKDAY_LABELS[weekday].slice(0, 2),
      }),
    );
  }

  const start = new Date(`${parsed.start.dateKey}T12:00:00`);
  const oldest = new Date();
  oldest.setDate(oldest.getDate() - 14);
  const newest = new Date();
  newest.setMonth(newest.getMonth() + 18);
  if (start < oldest || start > newest) return [];

  return [churchEventFromOutlook(parsed)];
}

export async function fetchOutlookCalendarIcs(url = getOutlookCalendarIcsUrl()) {
  if (!url) {
    throw new Error("Add OUTLOOK_CALENDAR_ICS_URL to connect admin@shanahcity.org Outlook.");
  }

  const response = await fetch(url, {
    cache: "no-store",
    headers: {
      Accept: "text/calendar, text/plain, */*",
      "User-Agent":
        "Mozilla/5.0 (compatible; ShanahCityCalendar/1.0; +https://shanah-city.vercel.app)",
    },
  });

  if (!response.ok) {
    throw new Error(`Outlook calendar could not be read (${response.status}).`);
  }

  return response.text();
}

export async function syncOutlookChurchCalendar() {
  if (!isOutlookCalendarConfigured()) {
    return {
      configured: false,
      created: 0,
      updated: 0,
      removed: 0,
      total: 0,
    };
  }

  const ics = await fetchOutlookCalendarIcs();
  const incoming = parseIcsEvents(ics).flatMap(toChurchEvents);
  const existing = await getEvents({ includeUnpublished: true, groupId: null });
  const existingById = new Map(existing.map((event) => [event.id, event]));
  const incomingIds = new Set(incoming.map((event) => event.id));

  let created = 0;
  let updated = 0;

  for (const event of incoming) {
    const previous = existingById.get(event.id);
    await upsertEvent({
      ...event,
      groupId: null,
      groupName: null,
      sortOrder: previous?.sortOrder ?? event.sortOrder,
    });
    if (previous) updated += 1;
    else created += 1;
  }

  let removed = 0;
  for (const event of existing) {
    if (!isOutlookSyncedEventId(event.id) || incomingIds.has(event.id)) continue;
    const deleted = await deleteEvent(event.id);
    if (deleted) removed += 1;
  }

  return {
    configured: true,
    created,
    updated,
    removed,
    total: incoming.length,
  };
}
