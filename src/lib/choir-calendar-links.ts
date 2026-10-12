import { SHANAH_WORSHIP_GROUP_ID } from "@/lib/choir-group-constants";
import type { ChoirCalendarEvent } from "@/lib/choir-calendar-types";

export function choirCalendarHref(
  groupId: string = SHANAH_WORSHIP_GROUP_ID,
  options?: { tab?: string; filter?: string; eventId?: string },
) {
  const base = `/groups/${encodeURIComponent(groupId)}/calendar`;
  const params = new URLSearchParams();
  if (options?.tab) params.set("tab", options.tab);
  if (options?.filter) params.set("filter", options.filter);
  if (options?.eventId) params.set("event", options.eventId);
  const query = params.toString();
  return query ? `${base}?${query}` : base;
}

/** Worship calendar with the rehearsals list selected (Page 4). */
export function choirCalendarRehearsalsHref(groupId: string = SHANAH_WORSHIP_GROUP_ID, eventId?: string) {
  return choirCalendarHref(groupId, { tab: "rehearsals", filter: "rehearsals", eventId });
}

export function isRehearsalCalendarEvent(event: ChoirCalendarEvent) {
  if (event.category === "rehearsal" || event.sourceType === "worship-rehearsal") {
    return true;
  }
  return event.title.toLowerCase().includes("rehearsal");
}

export function filterRehearsalEvents(events: ChoirCalendarEvent[]) {
  return events.filter(isRehearsalCalendarEvent).sort((a, b) => a.startsAtMs - b.startsAtMs);
}
