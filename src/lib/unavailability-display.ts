/**
 * Active ministry availability display rules.
 * A request remains visible through the end of its final day in America/Denver.
 * Historical requests remain stored for approval records and audit.
 */
export function denverTodayDateKey(now: Date = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Denver",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const get = (type: string) => parts.find((part) => part.type === type)?.value ?? "";
  return `${get("year")}-${get("month")}-${get("day")}`;
}

export type AvailabilityDisplayItem = {
  id: string;
  status: string;
  startDate: string;
  endDate: string;
};

export function activeApprovedAvailability<T extends AvailabilityDisplayItem>(
  requests: readonly T[],
  todayKey = denverTodayDateKey(),
): T[] {
  return requests
    .filter((item) =>
      item.status === "approved" &&
      /^\d{4}-\d{2}-\d{2}$/.test(item.startDate) &&
      /^\d{4}-\d{2}-\d{2}$/.test(item.endDate) &&
      item.endDate >= todayKey
    )
    .sort((a, b) => {
      const aCurrent = a.startDate <= todayKey ? 0 : 1;
      const bCurrent = b.startDate <= todayKey ? 0 : 1;
      return aCurrent - bCurrent ||
        a.startDate.localeCompare(b.startDate) ||
        a.endDate.localeCompare(b.endDate) ||
        a.id.localeCompare(b.id);
    });
}
