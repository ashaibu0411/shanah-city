import { getConfiguredWorshipGroupId } from "@/lib/worship-access-server";
import { getGroups } from "@/lib/group-server";
import { upsertEvent, deleteEvent } from "@/lib/event-server";
import type { UnavailabilityRequest } from "@/lib/member-types";
import type { ChurchEvent } from "@/lib/types";
import { unavailabilityCalendarEventId } from "@/lib/choir-calendar-utils";

async function choirGroupMeta() {
  const groupId = getConfiguredWorshipGroupId();
  const groups = await getGroups();
  const group = groups.find((entry) => entry.id === groupId);
  return {
    groupId,
    groupName: group?.name ?? "Shanah Worship (Choir)",
  };
}

function dayLabel(isoDate: string) {
  return new Date(`${isoDate}T12:00:00`).toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function buildRangeEvent(input: {
  id: string;
  title: string;
  startsOn: string;
  endsOn: string;
  time: string;
  location: string;
  groupId: string;
  groupName: string;
}): ChurchEvent {
  const start = dayLabel(input.startsOn);
  const end = dayLabel(input.endsOn);
  const dateLabel =
    input.startsOn === input.endsOn ? start : `${start} – ${end}`;

  return {
    id: input.id,
    title: input.title,
    date: dateLabel,
    time: input.time,
    location: input.location,
    groupId: input.groupId,
    groupName: input.groupName,
    startsOn: input.startsOn,
    endsOn: input.endsOn,
    published: true,
  };
}

/** Legacy worship-plan calendar rows — cleaned up when plans are deleted. */
export async function removeChoirCalendarForWorshipPlan(plan: {
  serviceDate: string;
  serviceTime: string;
}) {
  await Promise.all([
    deleteEvent(`choir-leader-${plan.serviceDate}-${plan.serviceTime.replace(":", "")}`),
    deleteEvent(`choir-rehearsal-${plan.serviceDate}-${plan.serviceTime.replace(":", "")}`),
  ]);
}

/** Worship plans use the service schedule for choir calendar entries now. */
export async function syncChoirCalendarForWorshipPlan() {
  return { leader: false, rehearsal: false };
}

export async function syncChoirCalendarForUnavailability(request: UnavailabilityRequest) {
  if (request.group !== "choir") return null;

  const eventId = unavailabilityCalendarEventId(request.id);

  if (request.status !== "approved") {
    await deleteEvent(eventId);
    return null;
  }

  const { groupId, groupName } = await choirGroupMeta();
  const reason = request.reason?.trim();
  const title = reason
    ? `${request.personName} away — ${reason}`
    : `${request.personName} away`;

  return upsertEvent(
    buildRangeEvent({
      id: eventId,
      title,
      startsOn: request.startDate,
      endsOn: request.endDate,
      time: "All day",
      location: "Unavailable",
      groupId,
      groupName,
    }),
  );
}
