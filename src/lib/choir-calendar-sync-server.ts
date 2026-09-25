import { getConfiguredWorshipGroupId } from "@/lib/worship-access-server";
import { getGroups } from "@/lib/group-server";
import { upsertEvent, deleteEvent } from "@/lib/event-server";
import type { UnavailabilityRequest } from "@/lib/member-types";
import type { ChurchEvent } from "@/lib/types";
import {
  unavailabilityCalendarEventId,
  worshipLeaderCalendarEventId,
  worshipRehearsalCalendarEventId,
} from "@/lib/choir-calendar-utils";
import {
  serviceDateTimeLabel,
  worshipTimeLabel,
  type WorshipServicePlan,
} from "@/lib/worship-types";

const DEFAULT_LOCATION = "Shanah City";

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

function buildSingleDayEvent(input: {
  id: string;
  title: string;
  day: string;
  timeRaw: string;
  location: string;
  groupId: string;
  groupName: string;
}): ChurchEvent {
  return buildRangeEvent({
    id: input.id,
    title: input.title,
    startsOn: input.day,
    endsOn: input.day,
    time: worshipTimeLabel(input.timeRaw) || input.timeRaw,
    location: input.location,
    groupId: input.groupId,
    groupName: input.groupName,
  });
}

export async function removeChoirCalendarForWorshipPlan(plan: WorshipServicePlan) {
  await Promise.all([
    deleteEvent(worshipLeaderCalendarEventId(plan.serviceDate, plan.serviceTime)),
    deleteEvent(worshipRehearsalCalendarEventId(plan.serviceDate, plan.serviceTime)),
  ]);
}

export async function syncChoirCalendarForWorshipPlan(plan: WorshipServicePlan) {
  if (plan.status !== "published") {
    await removeChoirCalendarForWorshipPlan(plan);
    return { leader: false, rehearsal: false };
  }

  const { groupId, groupName } = await choirGroupMeta();
  const leader = plan.team.find((member) => member.role === "worship-leader");
  let leaderSynced = false;
  let rehearsalSynced = false;

  if (leader) {
    await upsertEvent(
      buildSingleDayEvent({
        id: worshipLeaderCalendarEventId(plan.serviceDate, plan.serviceTime),
        title: `Worship leader: ${leader.name}`,
        day: plan.serviceDate,
        timeRaw: plan.serviceTime,
        location: DEFAULT_LOCATION,
        groupId,
        groupName,
      }),
    );
    leaderSynced = true;
  } else {
    await deleteEvent(worshipLeaderCalendarEventId(plan.serviceDate, plan.serviceTime));
  }

  if (plan.rehearsalDate) {
    await upsertEvent(
      buildSingleDayEvent({
        id: worshipRehearsalCalendarEventId(plan.serviceDate, plan.serviceTime),
        title: plan.title?.trim()
          ? `Rehearsal — ${plan.title.trim()}`
          : `Rehearsal — ${serviceDateTimeLabel(plan.serviceDate, plan.serviceTime)}`,
        day: plan.rehearsalDate,
        timeRaw: plan.rehearsalTime || "19:00",
        location: DEFAULT_LOCATION,
        groupId,
        groupName,
      }),
    );
    rehearsalSynced = true;
  } else {
    await deleteEvent(worshipRehearsalCalendarEventId(plan.serviceDate, plan.serviceTime));
  }

  return { leader: leaderSynced, rehearsal: rehearsalSynced };
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
