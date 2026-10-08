import type { CalendarPlannable } from "@/lib/calendar-utils";
import type {
  CoupleCalendarEventRecord,
  CoupleCalendarPlannable,
  CoupleCalendarRecurrence,
} from "@/lib/couple-calendar-types";
import { denverWallClockToDate, formatDenverTime, getZonedDateParts } from "@/lib/denver-time";

const CATEGORY_LABELS: Record<string, string> = {
  general: "General",
  "date-night": "Date night",
  anniversary: "Anniversary",
  family: "Family",
  appointment: "Appointment",
  church: "Church",
};

function addYearsToDateKey(dateKey: string, years: number) {
  const [year, month, day] = dateKey.split("-").map(Number);
  return `${year + years}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export function formatEventTimeLabel(event: Pick<CoupleCalendarEventRecord, "startAt" | "allDay" | "timezone">) {
  if (event.allDay) return "All day";
  return formatDenverTime(event.startAt);
}

export function recordToPlannable(record: CoupleCalendarEventRecord): CoupleCalendarPlannable {
  const tz = record.timezone || "America/Denver";
  const startParts = getZonedDateParts(new Date(record.startAt), tz);
  const dateKey = startParts.dateKey;
  const recurrence = (record.recurrence ?? "none") as CoupleCalendarRecurrence;
  const categoryLabel = CATEGORY_LABELS[record.category] ?? record.category;

  const base: CoupleCalendarPlannable = {
    id: record.id,
    title: record.title,
    time: record.allDay ? undefined : formatDenverTime(record.startAt),
    schedule: record.allDay ? "All day" : formatDenverTime(record.startAt),
    calendarPreview: `${categoryLabel}${record.notes ? `\n${record.notes}` : ""}`,
    category: record.category,
    allDay: record.allDay,
    notes: record.notes,
    startAt: record.startAt,
    endAt: record.endAt,
    timezone: tz,
    recurrence,
    reminderMin: record.reminderMin,
    createdBy: record.createdBy,
  };

  if (recurrence === "none") {
    const endKey = record.endAt
      ? getZonedDateParts(new Date(record.endAt), tz).dateKey
      : dateKey;
    return {
      ...base,
      startsOn: dateKey,
      endsOn: endKey,
    };
  }

  const rangeEnd = addYearsToDateKey(dateKey, 2);
  if (recurrence === "weekly") {
    return {
      ...base,
      startsOn: dateKey,
      endsOn: rangeEnd,
      recurringWeekday: startParts.weekday,
    };
  }

  if (recurrence === "daily") {
    return {
      ...base,
      startsOn: dateKey,
      endsOn: rangeEnd,
      recurringWeekdays: [0, 1, 2, 3, 4, 5, 6],
    };
  }

  return base;
}

export function virtualAnniversaryPlannables(
  anniversaryDate: string,
  yearsAhead = 2,
): CoupleCalendarPlannable[] {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(anniversaryDate.trim());
  if (!match) return [];

  const month = match[2];
  const day = match[3];
  const now = getZonedDateParts();
  const startYear = Number(now.year);
  const items: CoupleCalendarPlannable[] = [];

  for (let offset = 0; offset <= yearsAhead; offset += 1) {
    const year = startYear + offset;
    const dateKey = `${year}-${month}-${day}`;
    const yearsMarried = year - Number(match[1]);
    if (yearsMarried < 0) continue;

    items.push({
      id: `anniversary-${dateKey}`,
      title: yearsMarried === 0 ? "Wedding anniversary" : `${yearsMarried} year anniversary`,
      schedule: "All day",
      calendarPreview: "Anniversary\nCelebrate your covenant",
      startsOn: dateKey,
      endsOn: dateKey,
      category: "anniversary",
      allDay: true,
      startAt: denverWallClockToDate(dateKey, "12:00").toISOString(),
      timezone: "America/Denver",
      recurrence: "none",
      createdBy: "",
      isVirtualAnniversary: true,
    });
  }

  return items;
}

export function plannableToCalendarItems(
  items: CoupleCalendarPlannable[],
): CalendarPlannable[] {
  return items;
}

export function parseRecurrence(value: unknown): CoupleCalendarRecurrence {
  if (value === "daily" || value === "weekly") return value;
  return "none";
}

export function parseCategory(value: unknown): CoupleCalendarEventRecord["category"] {
  const raw = String(value ?? "general");
  const allowed = new Set([
    "general",
    "date-night",
    "anniversary",
    "family",
    "appointment",
    "church",
  ]);
  return allowed.has(raw) ? (raw as CoupleCalendarEventRecord["category"]) : "general";
}

export function buildStartEndIso(input: {
  dateKey: string;
  time?: string;
  endDateKey?: string;
  endTime?: string;
  allDay: boolean;
  timezone?: string;
}) {
  const tz = input.timezone?.trim() || "America/Denver";
  const startAt = input.allDay
    ? denverWallClockToDate(input.dateKey, "12:00", tz)
    : denverWallClockToDate(input.dateKey, input.time ?? "19:00", tz);

  let endAt: Date | undefined;
  if (input.endDateKey || (!input.allDay && input.endTime)) {
    const endKey = input.endDateKey || input.dateKey;
    endAt = input.allDay
      ? denverWallClockToDate(endKey, "23:59", tz)
      : denverWallClockToDate(endKey, input.endTime ?? input.time ?? "21:00", tz);
  }

  return {
    startAt: startAt.toISOString(),
    endAt: endAt?.toISOString(),
    timezone: tz,
  };
}
