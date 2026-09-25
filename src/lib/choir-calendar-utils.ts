export { choirScheduleCalendarEventId } from "@/lib/choir-service-schedule-types";

export const CHOIR_SYNCED_EVENT_PREFIXES = [
  "choir-schedule-",
  "choir-unavail-",
  "choir-leader-",
  "choir-rehearsal-",
] as const;

export function isChoirSyncedCalendarEventId(id: string) {
  return CHOIR_SYNCED_EVENT_PREFIXES.some((prefix) => id.startsWith(prefix));
}

export function choirSyncedEventHint(id: string) {
  if (id.startsWith("choir-schedule-")) {
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

export function unavailabilityCalendarEventId(requestId: string) {
  return `choir-unavail-${requestId}`;
}

export function calendarPreviewFromEvent(event: {
  id: string;
  title: string;
  rsvpInstructions?: string | null;
}) {
  if (event.id.startsWith("choir-schedule-") && event.rsvpInstructions?.trim()) {
    return event.rsvpInstructions.trim();
  }
  if (event.id.startsWith("choir-schedule-")) {
    return event.title;
  }
  return event.title;
}
