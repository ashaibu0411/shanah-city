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
