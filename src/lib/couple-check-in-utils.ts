import { getZonedDateParts } from "@/lib/denver-time";

/** Monday (YYYY-MM-DD) for the week containing `reference` in America/Denver. */
export function denverWeekStartKey(reference = new Date()) {
  const { dateKey, weekday } = getZonedDateParts(reference);
  const [year, month, day] = dateKey.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  const daysFromMonday = weekday === 0 ? 6 : weekday - 1;
  date.setUTCDate(date.getUTCDate() - daysFromMonday);
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}-${String(date.getUTCDate()).padStart(2, "0")}`;
}
