import type { PublicMember } from "@/lib/auth-types";
import { getEventById } from "@/lib/event-server";
import {
  canManageEventRsvpSettings,
  canViewEventRsvpRoster,
  isEventRsvpClosed,
  userInEventRsvpAudience,
} from "@/lib/event-rsvp-access-server";
import type {
  EventRsvpRecord,
  EventRsvpStatus,
  EventRsvpSummary,
  EventRsvpView,
} from "@/lib/event-rsvp-types";
import { useDatabase } from "@/lib/use-database";
import type { ChurchEvent } from "@/lib/types";
import * as eventRsvpDb from "@/lib/stores/event-rsvp-db";
import * as eventRsvpJson from "@/lib/stores/event-rsvp-json";

const store = () => (useDatabase() ? eventRsvpDb : eventRsvpJson);

function buildSummary(
  rsvps: EventRsvpRecord[],
  event: Pick<ChurchEvent, "rsvpCapacity">,
): EventRsvpSummary {
  const going = rsvps.filter((entry) => entry.status === "going").length;
  const notGoing = rsvps.filter((entry) => entry.status === "not_going").length;
  const maybe = rsvps.filter((entry) => entry.status === "maybe").length;
  const capacity = event.rsvpCapacity ?? null;
  return {
    going,
    notGoing,
    maybe,
    capacity,
    isFull: capacity != null && capacity > 0 && going >= capacity,
  };
}

export async function getEventRsvpView(
  event: ChurchEvent,
  viewer: PublicMember | null,
): Promise<EventRsvpView> {
  const enabled = Boolean(event.rsvpEnabled);
  const closed = enabled && isEventRsvpClosed(event);
  const canManage = await canManageEventRsvpSettings(viewer, event);
  const inAudience = await userInEventRsvpAudience(viewer, event);
  const canRespond = Boolean(viewer) && enabled && inAudience && !closed;

  if (!enabled) {
    return {
      enabled: false,
      closed: false,
      audience: null,
      deadline: null,
      instructions: null,
      myStatus: null,
      myNote: null,
      canRespond: false,
      canManage,
      inAudience: false,
      summary: null,
      roster: null,
    };
  }

  const rsvps = await store().getRsvpsForEvent(event.id);
  const mine = viewer ? rsvps.find((entry) => entry.userId === viewer.id) ?? null : null;
  const summary = buildSummary(rsvps, event);
  const showRoster = viewer && (await canViewEventRsvpRoster(viewer, event));

  return {
    enabled: true,
    closed,
    audience: event.rsvpAudience ?? (event.groupId ? "group" : "church"),
    audienceGroupName: event.rsvpGroupName ?? event.groupName ?? null,
    deadline: event.rsvpDeadline ?? null,
    instructions: event.rsvpInstructions ?? null,
    myStatus: mine?.status ?? null,
    myNote: mine?.note ?? null,
    canRespond,
    canManage,
    inAudience,
    summary: inAudience || canManage ? summary : null,
    roster: showRoster
      ? rsvps.map((entry) => ({
          userId: entry.userId,
          userName: entry.userName,
          status: entry.status,
          note: entry.note,
          updatedAt: entry.updatedAt,
        }))
      : null,
  };
}

export async function submitEventRsvp(input: {
  eventId: string;
  viewer: PublicMember;
  status: EventRsvpStatus;
  note?: string;
}) {
  const event = await getEventById(input.eventId);
  if (!event) {
    throw new Error("Event not found.");
  }
  if (!event.rsvpEnabled) {
    throw new Error("RSVP is not enabled for this event.");
  }
  if (isEventRsvpClosed(event)) {
    throw new Error("RSVP is closed for this event.");
  }
  if (!(await userInEventRsvpAudience(input.viewer, event))) {
    throw new Error("You are not in the RSVP audience for this event.");
  }

  const existing = await store().getRsvpsForEvent(event.id);
  const summary = buildSummary(existing, event);
  if (
    input.status === "going" &&
    summary.isFull &&
    !existing.some(
      (entry) => entry.userId === input.viewer.id && entry.status === "going",
    )
  ) {
    throw new Error("This event is full.");
  }

  const record = await store().upsertEventRsvp({
    eventId: event.id,
    userId: input.viewer.id,
    userName: input.viewer.name,
    userEmail: input.viewer.email,
    status: input.status,
    note: input.note,
  });

  const view = await getEventRsvpView(event, input.viewer);
  return { record, view };
}

export async function getEventRsvpViewById(eventId: string, viewer: PublicMember | null) {
  const event = await getEventById(eventId);
  if (!event) return null;
  return getEventRsvpView(event, viewer);
}
