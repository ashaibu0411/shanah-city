export {
  choirScheduleCalendarEventId,
  groupScheduleCalendarEventId,
  legacyChoirScheduleCalendarEventId,
} from "@/lib/choir-service-schedule-types";

export const GROUP_SYNCED_EVENT_PREFIXES = [
  "group-schedule-",
  "choir-schedule-",
  "choir-unavail-",
  "choir-leader-",
  "choir-rehearsal-",
] as const;

/** @deprecated Use GROUP_SYNCED_EVENT_PREFIXES */
export const CHOIR_SYNCED_EVENT_PREFIXES = GROUP_SYNCED_EVENT_PREFIXES;

export function isGroupSyncedCalendarEventId(id: string) {
  return GROUP_SYNCED_EVENT_PREFIXES.some((prefix) => id.startsWith(prefix));
}

/** @deprecated Use isGroupSyncedCalendarEventId */
export function isChoirSyncedCalendarEventId(id: string) {
  return isGroupSyncedCalendarEventId(id);
}

export function groupSyncedEventHint(id: string) {
  if (id.startsWith("group-schedule-") || id.startsWith("choir-schedule-")) {
    return "Service schedule — edit in Service schedule above";
  }
  if (id.startsWith("choir-unavail-")) {
    return "Synced from approved time away";
  }
  if (id.startsWith("choir-leader-") || id.startsWith("choir-rehearsal-")) {
    return "Legacy entry — remove and use Service schedule";
  }
  return "Synced automatically";
}

/** @deprecated Use groupSyncedEventHint */
export function choirSyncedEventHint(id: string) {
  return groupSyncedEventHint(id);
}

export function unavailabilityCalendarEventId(requestId: string) {
  return `choir-unavail-${requestId}`;
}

export function calendarPreviewFromEvent(event: {
  id: string;
  title: string;
  rsvpInstructions?: string | null;
}) {
  if (
    (event.id.startsWith("group-schedule-") || event.id.startsWith("choir-schedule-")) &&
    event.rsvpInstructions?.trim()
  ) {
    return event.rsvpInstructions.trim();
  }
  if (event.id.startsWith("group-schedule-") || event.id.startsWith("choir-schedule-")) {
    return event.title;
  }
  return event.title;
}

export function isGroupScheduleDetailEvent(eventId: string) {
  return eventId.startsWith("group-schedule-") || eventId.startsWith("choir-schedule-");
}
