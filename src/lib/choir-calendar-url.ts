import type { ChoirCalendarEventCategory } from "@/lib/choir-calendar-types";

export type ChoirCalendarDisplayMode = "month" | "agenda";

export type ChoirCalendarCategoryFilter = "all" | ChoirCalendarEventCategory | "mine";

export function parseCalendarDisplayMode(value: string | null): ChoirCalendarDisplayMode {
  return value === "agenda" ? "agenda" : "month";
}

export function parseCalendarCategoryFilter(
  filter: string | null,
  tab: string | null,
): ChoirCalendarCategoryFilter {
  if (filter === "rehearsals" || tab === "rehearsals") return "rehearsal";
  if (filter === "mine" || filter === "my" || filter === "assignments") return "mine";
  if (filter === "service" || filter === "services") return "service";
  if (filter === "rehearsal") return "rehearsal";
  if (filter === "event" || filter === "events" || filter === "special") return "event";
  return "all";
}

export function categoryFilterToParam(filter: ChoirCalendarCategoryFilter): string | null {
  if (filter === "all") return null;
  if (filter === "mine") return "mine";
  return filter;
}
