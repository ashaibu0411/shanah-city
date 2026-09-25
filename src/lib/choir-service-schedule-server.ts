import { getConfiguredWorshipGroupId } from "@/lib/worship-access-server";
import { getGroups } from "@/lib/group-server";
import { upsertEvent, deleteEvent } from "@/lib/event-server";
import {
  choirScheduleCalendarEventId,
  formatChoirScheduleCalendarPreview,
  choirServiceProgramLabel,
  type ChoirScheduleAssignment,
  type ChoirServiceScheduleEntry,
} from "@/lib/choir-service-schedule-types";
import { worshipTimeLabel } from "@/lib/worship-types";
import { useDatabase } from "@/lib/use-database";
import * as scheduleDb from "@/lib/stores/choir-service-schedule-db";
import * as scheduleJson from "@/lib/stores/choir-service-schedule-json";

const store = () => (useDatabase() ? scheduleDb : scheduleJson);

export const listChoirServiceSchedules = () => store().listChoirServiceSchedules();
export const saveChoirServiceSchedule = (
  input: Parameters<typeof scheduleJson.saveChoirServiceSchedule>[0],
) => store().saveChoirServiceSchedule(input);
export const deleteChoirServiceSchedule = (id: string) => store().deleteChoirServiceSchedule(id);

async function choirGroupMeta() {
  const groupId = getConfiguredWorshipGroupId();
  const groups = await getGroups();
  const group = groups.find((entry) => entry.id === groupId);
  return {
    groupId,
    groupName: group?.name ?? "Shanah Worship (Choir)",
  };
}

export async function syncChoirServiceScheduleToCalendar(entry: ChoirServiceScheduleEntry) {
  const { groupId, groupName } = await choirGroupMeta();
  const preview = formatChoirScheduleCalendarPreview(entry);
  const dayLabel = new Date(`${entry.serviceDate}T12:00:00`).toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });

  await upsertEvent({
    id: choirScheduleCalendarEventId(entry.id),
    title: choirServiceProgramLabel(entry.program),
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

export async function removeChoirServiceScheduleFromCalendar(entryId: string) {
  await deleteEvent(choirScheduleCalendarEventId(entryId));
}

export function validateChoirServiceScheduleInput(input: {
  serviceDate: string;
  serviceTime: string;
  program: ChoirServiceScheduleEntry["program"];
  assignments: ChoirScheduleAssignment[];
}) {
  if (!input.serviceDate.trim() || !input.serviceTime.trim()) {
    throw new Error("Service date and time are required.");
  }

  const valid = input.assignments.filter((item) => item.personName.trim());
  if (valid.length === 0) {
    throw new Error("Add at least one person with a name and role.");
  }
}

export async function persistChoirServiceSchedule(
  input: Parameters<typeof saveChoirServiceSchedule>[0],
) {
  validateChoirServiceScheduleInput(input);
  const entry = await saveChoirServiceSchedule({
    ...input,
    assignments: input.assignments
      .filter((item) => item.personName.trim())
      .map((item) => ({
        role: item.role,
        personName: item.personName.trim(),
      })),
  });
  await syncChoirServiceScheduleToCalendar(entry);
  return entry;
}

export async function removeChoirServiceScheduleEntry(id: string) {
  const removed = await deleteChoirServiceSchedule(id);
  if (removed) {
    await removeChoirServiceScheduleFromCalendar(id);
  }
  return removed;
}

export function isChoirScheduleReadOnlyError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  return /EROFS|read-only file system|read-only/i.test(message);
}
