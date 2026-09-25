import { getGroups } from "@/lib/group-server";
import { upsertEvent, deleteEvent } from "@/lib/event-server";
import {
  formatGroupScheduleCalendarPreview,
  groupScheduleCalendarEventId,
  legacyChoirScheduleCalendarEventId,
  type GroupScheduleAssignment,
  type GroupServiceScheduleEntry,
} from "@/lib/choir-service-schedule-types";
import {
  getGroupServiceScheduleConfig,
  programLabel,
} from "@/lib/group-service-schedule-config";
import { worshipTimeLabel } from "@/lib/worship-types";
import { useDatabase } from "@/lib/use-database";
import * as scheduleDb from "@/lib/stores/choir-service-schedule-db";
import * as scheduleJson from "@/lib/stores/choir-service-schedule-json";
import { getConfiguredWorshipGroupId } from "@/lib/worship-access-server";
import {
  notifyChoirServiceScheduleRemoved,
  notifyChoirServiceScheduleSaved,
} from "@/lib/choir-notify-server";

const store = () => (useDatabase() ? scheduleDb : scheduleJson);

export const listGroupServiceSchedules = (groupId: string) =>
  store().listGroupServiceSchedules(groupId);

/** @deprecated Use listGroupServiceSchedules */
export const listChoirServiceSchedules = () =>
  listGroupServiceSchedules("group-choir");

export const saveGroupServiceSchedule = (
  input: Parameters<typeof scheduleJson.saveGroupServiceSchedule>[0],
) => store().saveGroupServiceSchedule(input);

export const deleteGroupServiceSchedule = (id: string, groupId: string) =>
  store().deleteGroupServiceSchedule(id, groupId);

async function groupMeta(groupId: string) {
  const groups = await getGroups();
  const group = groups.find((entry) => entry.id === groupId);
  return {
    groupId,
    groupName: group?.name ?? "Ministry group",
  };
}

export async function syncGroupServiceScheduleToCalendar(entry: GroupServiceScheduleEntry) {
  const config = getGroupServiceScheduleConfig(entry.groupId);
  if (!config) {
    throw new Error("This group does not use service schedules.");
  }

  const { groupId, groupName } = await groupMeta(entry.groupId);
  const preview = formatGroupScheduleCalendarPreview(entry, config);
  const dayLabel = new Date(`${entry.serviceDate}T12:00:00`).toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });

  const eventId = groupScheduleCalendarEventId(groupId, entry.id);

  await deleteEvent(legacyChoirScheduleCalendarEventId(entry.id)).catch(() => undefined);

  await upsertEvent({
    id: eventId,
    title: programLabel(config, entry.program),
    date: dayLabel,
    time: worshipTimeLabel(entry.serviceTime) || entry.serviceTime,
    location: "Shanah City",
    groupId,
    groupName,
    startsOn: entry.serviceDate,
    endsOn: entry.serviceDate,
    published: true,
    rsvpEnabled: false,
    rsvpInstructions: preview,
  });

  return preview;
}

export async function removeGroupServiceScheduleFromCalendar(
  groupId: string,
  entryId: string,
) {
  await deleteEvent(groupScheduleCalendarEventId(groupId, entryId));
  if (groupId === "group-choir") {
    await deleteEvent(legacyChoirScheduleCalendarEventId(entryId)).catch(() => undefined);
  }
}

export function validateGroupServiceScheduleInput(input: {
  serviceDate: string;
  serviceTime: string;
  assignments: GroupScheduleAssignment[];
}) {
  if (!input.serviceDate.trim() || !input.serviceTime.trim()) {
    throw new Error("Service date and time are required.");
  }

  const valid = input.assignments.filter((item) => item.personName.trim());
  if (valid.length === 0) {
    throw new Error("Add at least one person with a name and role.");
  }
}

export async function persistGroupServiceSchedule(
  input: Parameters<typeof saveGroupServiceSchedule>[0],
) {
  validateGroupServiceScheduleInput(input);
  const prior =
    input.id?.trim() &&
    (await listGroupServiceSchedules(input.groupId)).find((entry) => entry.id === input.id?.trim());

  const entry = await saveGroupServiceSchedule({
    ...input,
    assignments: input.assignments
      .filter((item) => item.personName.trim())
      .map((item) => ({
        role: item.role,
        personName: item.personName.trim(),
      })),
  });
  await syncGroupServiceScheduleToCalendar(entry);

  if (input.groupId === getConfiguredWorshipGroupId()) {
    await notifyChoirServiceScheduleSaved({
      entry,
      actor: input.actor,
      isUpdate: Boolean(prior),
    }).catch(() => undefined);
  }

  return entry;
}

/** @deprecated Use persistGroupServiceSchedule */
export const persistChoirServiceSchedule = persistGroupServiceSchedule;

export async function removeGroupServiceScheduleEntry(
  id: string,
  groupId: string,
  actor?: { id: string; name: string },
) {
  const existing = (await listGroupServiceSchedules(groupId)).find((entry) => entry.id === id);
  const removed = await deleteGroupServiceSchedule(id, groupId);
  if (removed) {
    await removeGroupServiceScheduleFromCalendar(groupId, id);
    if (existing && actor && groupId === getConfiguredWorshipGroupId()) {
      await notifyChoirServiceScheduleRemoved({
        groupId,
        serviceDate: existing.serviceDate,
        serviceTime: existing.serviceTime,
        program: existing.program,
        actor,
      }).catch(() => undefined);
    }
  }
  return removed;
}

/** @deprecated Use removeGroupServiceScheduleEntry */
export async function removeChoirServiceScheduleEntry(
  id: string,
  actor?: { id: string; name: string },
) {
  return removeGroupServiceScheduleEntry(id, "group-choir", actor);
}

export function isChoirScheduleReadOnlyError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  return /EROFS|read-only file system|read-only/i.test(message);
}

/** @deprecated Use syncGroupServiceScheduleToCalendar */
export const syncChoirServiceScheduleToCalendar = syncGroupServiceScheduleToCalendar;
