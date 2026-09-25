import { getConfiguredWorshipGroupId } from "@/lib/worship-access-server";
import { getGroups } from "@/lib/group-server";
import { upsertEvent, deleteEvent } from "@/lib/event-server";
import {
  choirScheduleCalendarEventId,
  formatChoirSchedulePreview,
  choirServiceProgramLabel,
  type ChoirServiceScheduleEntry,
} from "@/lib/choir-service-schedule-types";
import { worshipTimeLabel } from "@/lib/worship-types";
import * as scheduleJson from "@/lib/stores/choir-service-schedule-json";

const store = () => scheduleJson;

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
  const preview = formatChoirSchedulePreview(entry);
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
  leadRole: ChoirServiceScheduleEntry["leadRole"];
  worshipLeaderName?: string;
  praiseLeaderName?: string;
  ministration: boolean;
  ministrationBy?: string;
}) {
  if (!input.serviceDate.trim() || !input.serviceTime.trim()) {
    throw new Error("Service date and time are required.");
  }
  if (input.leadRole === "worship" || input.leadRole === "both") {
    if (!input.worshipLeaderName?.trim()) {
      throw new Error("Enter who is leading worship.");
    }
  }
  if (input.leadRole === "praise" || input.leadRole === "both") {
    if (!input.praiseLeaderName?.trim()) {
      throw new Error("Enter who is leading praise.");
    }
  }
  if (input.ministration && !input.ministrationBy?.trim()) {
    // Ministration flagged without a name — calendar will show TBD.
  }
}

export async function persistChoirServiceSchedule(
  input: Parameters<typeof saveChoirServiceSchedule>[0],
) {
  validateChoirServiceScheduleInput(input);
  const entry = await saveChoirServiceSchedule(input);
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
