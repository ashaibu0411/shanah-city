export const CHOIR_SYNCED_EVENT_PREFIXES = [
  "choir-leader-",
  "choir-rehearsal-",
  "choir-unavail-",
] as const;

export function isChoirSyncedCalendarEventId(id: string) {
  return CHOIR_SYNCED_EVENT_PREFIXES.some((prefix) => id.startsWith(prefix));
}

export function choirSyncedEventHint(id: string) {
  if (id.startsWith("choir-leader-")) {
    return "Synced from published worship leader schedule";
  }
  if (id.startsWith("choir-rehearsal-")) {
    return "Synced from worship rehearsal plan";
  }
  if (id.startsWith("choir-unavail-")) {
    return "Synced from approved time away";
  }
  return "Synced automatically";
}

export function worshipLeaderCalendarEventId(serviceDate: string, serviceTime: string) {
  return `choir-leader-${serviceDate}-${serviceTime.replace(":", "")}`;
}

export function worshipRehearsalCalendarEventId(serviceDate: string, serviceTime: string) {
  return `choir-rehearsal-${serviceDate}-${serviceTime.replace(":", "")}`;
}

export function unavailabilityCalendarEventId(requestId: string) {
  return `choir-unavail-${requestId}`;
}
