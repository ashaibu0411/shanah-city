import { promises as fs } from "fs";
import path from "path";
import {
  normalizeGroupScheduleEntry,
  type GroupScheduleAssignment,
  type GroupServiceScheduleEntry,
} from "@/lib/choir-service-schedule-types";

const DATA_DIR = path.join(process.cwd(), "data");
const SCHEDULE_FILE = path.join(DATA_DIR, "choir-service-schedule.json");

async function readJson<T>(file: string, fallback: T): Promise<T> {
  try {
    const raw = await fs.readFile(file, "utf-8");
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

async function writeJson<T>(file: string, data: T) {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(file, JSON.stringify(data, null, 2));
}

export async function listGroupServiceSchedules(groupId: string) {
  const entries = await readJson<GroupServiceScheduleEntry[]>(SCHEDULE_FILE, []);
  return entries
    .map((entry) => normalizeGroupScheduleEntry(entry, entry.groupId ?? groupId))
    .filter((entry) => entry.groupId === groupId)
    .sort(
      (a, b) =>
        a.serviceDate.localeCompare(b.serviceDate) ||
        a.serviceTime.localeCompare(b.serviceTime),
    );
}

/** @deprecated Use listGroupServiceSchedules */
export async function listChoirServiceSchedules() {
  return listGroupServiceSchedules("group-choir");
}

export async function saveGroupServiceSchedule(input: {
  id?: string;
  groupId: string;
  serviceDate: string;
  serviceTime: string;
  program: string;
  assignments: GroupScheduleAssignment[];
  notes?: string;
  actor: { id: string; name: string };
}) {
  const entries = await readJson<GroupServiceScheduleEntry[]>(SCHEDULE_FILE, []);
  const now = new Date().toISOString();
  const id = input.id?.trim() || `gss-${Date.now()}`;

  const entry = normalizeGroupScheduleEntry(
    {
      id,
      groupId: input.groupId,
      serviceDate: input.serviceDate.trim(),
      serviceTime: input.serviceTime.trim(),
      program: input.program,
      assignments: input.assignments,
      notes: input.notes?.trim() || undefined,
      createdAt: entries.find((item) => item.id === id)?.createdAt ?? now,
      updatedAt: now,
      createdBy: input.actor.id,
      createdByName: input.actor.name,
    },
    input.groupId,
  );

  const index = entries.findIndex((item) => item.id === id && item.groupId === input.groupId);
  if (index >= 0) {
    entries[index] = entry;
  } else {
    entries.push(entry);
  }

  await writeJson(SCHEDULE_FILE, entries);
  return entry;
}

/** @deprecated Use saveGroupServiceSchedule */
export const saveChoirServiceSchedule = saveGroupServiceSchedule;

export async function deleteGroupServiceSchedule(id: string, groupId: string) {
  const entries = await readJson<GroupServiceScheduleEntry[]>(SCHEDULE_FILE, []);
  const next = entries.filter((item) => !(item.id === id && item.groupId === groupId));
  if (next.length === entries.length) return false;
  await writeJson(SCHEDULE_FILE, next);
  return true;
}

/** @deprecated Use deleteGroupServiceSchedule */
export async function deleteChoirServiceSchedule(id: string) {
  return deleteGroupServiceSchedule(id, "group-choir");
}
