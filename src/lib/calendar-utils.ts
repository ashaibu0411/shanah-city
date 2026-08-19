export function isOutlookSyncedEventId(id: string) {
  return id.startsWith("outlook-");
}

export type CalendarPlannable = {
  id: string;
  title: string;
  date?: string;
  time?: string;
  schedule?: string;
  startsOn?: string | null;
  endsOn?: string | null;
  recurringWeekday?: number | null;
  recurringWeekdays?: number[] | null;
};

const WEEKDAY_LABELS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
] as const;

export const WEEKDAY_OPTIONS = WEEKDAY_LABELS.map((label, value) => ({ label, value }));

function parseIsoDate(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function toIsoDate(year: number, month: number, day: number) {
  const paddedMonth = String(month + 1).padStart(2, "0");
  const paddedDay = String(day).padStart(2, "0");
  return `${year}-${paddedMonth}-${paddedDay}`;
}

export function inferRecurringWeekday(item: CalendarPlannable): number | null {
  if (
    typeof item.recurringWeekday === "number" &&
    item.recurringWeekday >= 0 &&
    item.recurringWeekday <= 6
  ) {
    return item.recurringWeekday;
  }

  const label = `${item.date ?? ""} ${item.schedule ?? ""}`.toLowerCase();
  if (label.includes("sunday")) return 0;
  if (label.includes("monday")) return 1;
  if (label.includes("tuesday")) return 2;
  if (label.includes("wednesday")) return 3;
  if (label.includes("thursday")) return 4;
  if (label.includes("friday")) return 5;
  if (label.includes("saturday")) return 6;
  return null;
}

function inferWeekdayRange(item: CalendarPlannable): number[] | null {
  const label = `${item.date ?? ""} ${item.schedule ?? ""}`.toLowerCase();
  const hasRangeMark =
    label.includes("–") ||
    label.includes("-") ||
    label.includes("through") ||
    label.includes("to");
  const mentionsTuesdayToThursday =
    label.includes("tuesday") && label.includes("thursday") && hasRangeMark;
  if (mentionsTuesdayToThursday) {
    return [2, 3, 4];
  }
  const mentionsMondayToFriday =
    label.includes("monday") && label.includes("friday") && hasRangeMark;
  if (mentionsMondayToFriday || label.includes("weekday")) {
    return [1, 2, 3, 4, 5];
  }
  return null;
}

function inferMonthlyWeekday(item: CalendarPlannable): number | null {
  const label = `${item.date ?? ""} ${item.schedule ?? ""}`.toLowerCase();
  if (!label.includes("first")) return null;
  if (label.includes("sunday")) return 0;
  if (label.includes("monday")) return 1;
  if (label.includes("tuesday")) return 2;
  if (label.includes("wednesday")) return 3;
  if (label.includes("thursday")) return 4;
  if (label.includes("friday")) return 5;
  if (label.includes("saturday")) return 6;
  return null;
}

function recurringWeekdaysFor(item: CalendarPlannable): number[] {
  if (Array.isArray(item.recurringWeekdays) && item.recurringWeekdays.length > 0) {
    return item.recurringWeekdays.filter((day) => day >= 0 && day <= 6);
  }

  const range = inferWeekdayRange(item);
  if (range) return range;

  const weekday = inferRecurringWeekday(item);
  return weekday == null ? [] : [weekday];
}

export function getDatesInMonth(
  item: CalendarPlannable,
  year: number,
  month: number,
): string[] {
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const dates: string[] = [];
  const monthlyWeekday = inferMonthlyWeekday(item);

  if (monthlyWeekday != null && !item.startsOn) {
    for (let day = 1; day <= Math.min(7, daysInMonth); day += 1) {
      if (new Date(year, month, day).getDay() === monthlyWeekday) {
        dates.push(toIsoDate(year, month, day));
        break;
      }
    }
    return dates;
  }

  const weekdays = recurringWeekdaysFor(item);

  if (item.startsOn) {
    const rangeStart = parseIsoDate(item.startsOn);
    const rangeEnd = parseIsoDate(item.endsOn ?? item.startsOn);
    for (let day = 1; day <= daysInMonth; day += 1) {
      const current = new Date(year, month, day);
      if (current >= rangeStart && current <= rangeEnd) {
        if (weekdays.length === 0 || weekdays.includes(current.getDay())) {
          dates.push(toIsoDate(year, month, day));
        }
      }
    }
    return dates;
  }

  if (weekdays.length === 0) {
    return dates;
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    if (weekdays.includes(new Date(year, month, day).getDay())) {
      dates.push(toIsoDate(year, month, day));
    }
  }

  return dates;
}

export function groupItemsByDate<T extends CalendarPlannable>(
  items: T[],
  year: number,
  month: number,
) {
  const map = new Map<string, T[]>();

  for (const item of items) {
    for (const isoDate of getDatesInMonth(item, year, month)) {
      const bucket = map.get(isoDate) ?? [];
      bucket.push(item);
      map.set(isoDate, bucket);
    }
  }

  return map;
}

export function formatMonthLabel(year: number, month: number) {
  return new Date(year, month, 1).toLocaleDateString(undefined, {
    month: "long",
    year: "numeric",
  });
}

export function formatSelectedDay(isoDate: string) {
  return new Date(`${isoDate}T12:00:00`).toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export function shiftMonth(year: number, month: number, delta: number) {
  const next = new Date(year, month + delta, 1);
  return { year: next.getFullYear(), month: next.getMonth() };
}
