const DAY_MS = 24 * 60 * 60 * 1000;

export function startOfWeekMonday(date = new Date()) {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  const day = copy.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  copy.setDate(copy.getDate() + diff);
  return copy;
}

export function endOfWeekSunday(weekStart: Date) {
  const end = new Date(weekStart);
  end.setDate(end.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  return end;
}

export function weekStartIso(date = new Date()) {
  return startOfWeekMonday(date).toISOString();
}

export function weekLabel(weekStart: Date) {
  const end = endOfWeekSunday(weekStart);
  const sameMonth = weekStart.getMonth() === end.getMonth();
  const startLabel = weekStart.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
  const endLabel = end.toLocaleDateString(undefined, {
    month: sameMonth ? undefined : "short",
    day: "numeric",
  });
  return `${startLabel} – ${endLabel}`;
}

export function shiftWeek(weekStartIsoValue: string, weeks: number) {
  const start = new Date(weekStartIsoValue);
  start.setTime(start.getTime() + weeks * 7 * DAY_MS);
  return start.toISOString();
}

export function daysInWeek(weekStart: Date) {
  return Array.from({ length: 7 }, (_, index) => {
    const day = new Date(weekStart);
    day.setDate(day.getDate() + index);
    return day;
  });
}
