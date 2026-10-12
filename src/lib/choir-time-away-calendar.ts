import type { PublicMember } from "@/lib/auth-types";
import { choirAvailabilityHref } from "@/lib/choir-availability-links";
import { SHANAH_WORSHIP_GROUP_ID } from "@/lib/choir-group-constants";
import type { ChoirCalendarEvent } from "@/lib/choir-calendar-types";
import type { UnavailabilityRequest } from "@/lib/member-types";
import {
  eachIsoDateKeyInRange,
  formatAmericanDateRange,
  personNamesMatch,
} from "@/lib/unavailability-dates";

function isVisibleTimeAwayRequest(request: UnavailabilityRequest, user: PublicMember) {
  if (request.status === "approved") return true;
  return personNamesMatch(request.personName, user.name);
}

export function buildChoirTimeAwayCalendarEvents(
  user: PublicMember,
  requests: UnavailabilityRequest[],
): ChoirCalendarEvent[] {
  const choirRequests = requests.filter(
    (row) => row.group === "choir" && isVisibleTimeAwayRequest(row, user),
  );
  const events: ChoirCalendarEvent[] = [];

  for (const request of choirRequests) {
    const dateKeys = eachIsoDateKeyInRange(request.startDate, request.endDate);
    const rangeLabel = formatAmericanDateRange(request.startDate, request.endDate);
    if (request.status === "rejected") continue;

    const pending = request.status === "pending";
    const baseTitle = pending
      ? `${request.personName} — time away (pending)`
      : `${request.personName} — away`;

    for (const dateKey of dateKeys) {
      events.push({
        id: `choir-time-away-${request.id}-${dateKey}`,
        sourceType: "group-event",
        sourceId: request.id,
        category: "time-away",
        title: baseTitle,
        dateKey,
        timeLabel: pending ? "Pending approval · MT" : "All day · Mountain Time",
        location: request.reason,
        description: rangeLabel,
        teamLabel: pending ? "Awaiting leader approval" : "Approved time away",
        personalRoleLabel: personNamesMatch(request.personName, user.name) ? "You" : null,
        personalStatus: null,
        detailHref: `${choirAvailabilityHref(SHANAH_WORSHIP_GROUP_ID, "time-away")}`,
        startsAtMs: new Date(`${dateKey}T12:00:00`).getTime(),
      });
    }
  }

  return events;
}
