const WEEKDAY_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;

export type ZonedDateParts = {
  year: string;
  month: string;
  day: string;
  hour: number;
  minute: number;
  weekday: number;
  dateKey: string;
};

export function getZonedDateParts(
  date = new Date(),
  timeZone = "America/Denver",
): ZonedDateParts {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone,
    weekday: "short",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    hourCycle: "h23",
  });

  const parts = Object.fromEntries(
    formatter.formatToParts(date).map((part) => [part.type, part.value]),
  );
  const weekday = WEEKDAY_SHORT.indexOf(
    parts.weekday as (typeof WEEKDAY_SHORT)[number],
  );

  return {
    year: parts.year,
    month: parts.month,
    day: parts.day,
    hour: Number(parts.hour),
    minute: Number(parts.minute),
    weekday: weekday < 0 ? 0 : weekday,
    dateKey: `${parts.year}-${parts.month}-${parts.day}`,
  };
}

export function isDenverWeekday(date = new Date()) {
  const weekday = getZonedDateParts(date).weekday;
  return weekday >= 1 && weekday <= 5;
}

function addDaysToDateKey(dateKey: string, days: number) {
  const [year, month, day] = dateKey.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day + days));
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}-${String(date.getUTCDate()).padStart(2, "0")}`;
}

/** Sunday through Saturday in America/Denver for the given reference date. */
export function getDenverWeekRange(reference = new Date()) {
  const { dateKey, weekday } = getZonedDateParts(reference);
  const since = addDaysToDateKey(dateKey, -weekday);
  const until = addDaysToDateKey(dateKey, 6 - weekday);
  return { since, until };
}

/** The most recently completed Sun–Sat week in America/Denver. */
export function getPreviousDenverWeekRange(reference = new Date()) {
  const { dateKey, weekday } = getZonedDateParts(reference);
  const daysSinceSaturday = weekday === 6 ? 0 : weekday + 1;
  const until = addDaysToDateKey(dateKey, -daysSinceSaturday);
  const since = addDaysToDateKey(until, -6);
  return { since, until };
}

export function isDenverSunday(date = new Date()) {
  return getZonedDateParts(date).weekday === 0;
}

export function formatDenverTime(value: string | Date) {
  const date = typeof value === "string" ? new Date(value) : value;
  return date.toLocaleTimeString("en-US", {
    timeZone: "America/Denver",
    hour: "numeric",
    minute: "2-digit",
  });
}
