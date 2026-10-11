import type { ChurchEvent } from "@/lib/types";

export function parseChurchEventDay(event: ChurchEvent): Date | null {
  const raw = event.startsOn?.trim() || event.date?.trim();
  if (!raw) return null;
  const parsed = new Date(`${raw}T12:00:00`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function pickUpcomingPublishedEvents(events: ChurchEvent[], limit = 3) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return events
    .filter((event) => event.published !== false)
    .map((event) => ({ event, day: parseChurchEventDay(event) }))
    .filter((row) => row.day && row.day >= today)
    .sort((a, b) => a.day!.getTime() - b.day!.getTime())
    .slice(0, limit)
    .map((row) => row.event);
}

export function formatHomeEventMeta(event: ChurchEvent) {
  const day = parseChurchEventDay(event);
  const dateLabel = day
    ? day.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })
    : event.date || "Date TBA";
  const meta = [dateLabel, event.time].filter(Boolean).join(" · ");
  return { day, dateLabel, meta };
}
