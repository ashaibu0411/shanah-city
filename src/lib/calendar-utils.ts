export type CalendarPlannable = {
  id: string;
  title: string;
  date?: string;
  startsOn?: string | null;
  endsOn?: string | null;
  recurringWeekday?: number | null;
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

  const label = (item.date ?? "").toLowerCase();
  if (label.includes("sunday")) return 0;
  if (label.includes("monday")) return 1;
  if (label.includes("tuesday")) return 2;
  if (label.includes("wednesday")) return 3;
  if (label.includes("thursday")) return 4;
  if (label.includes("friday")) return 5;
  if (label.includes("saturday")) return 6;
  return null;
}

export function getDatesInMonth(
  item: CalendarPlannable,
  year: number,
  month: number,
): string[] {
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const dates: string[] = [];

  if (item.startsOn) {
    const rangeStart = parseIsoDate(item.startsOn);
    const rangeEnd = parseIsoDate(item.endsOn ?? item.startsOn);
    for (let day = 1; day <= daysInMonth; day += 1) {
      const current = new Date(year, month, day);
      if (current >= rangeStart && current <= rangeEnd) {
        dates.push(toIsoDate(year, month, day));
      }
    }
    return dates;
  }

  const weekday = inferRecurringWeekday(item);
  if (weekday == null) {
    return dates;
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    if (new Date(year, month, day).getDay() === weekday) {
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
