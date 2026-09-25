import { promises as fs } from "fs";
import path from "path";
import {
  normalizeChoirScheduleEntry,
  type ChoirScheduleAssignment,
  type ChoirServiceScheduleEntry,
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

export async function listChoirServiceSchedules() {
  const entries = await readJson<ChoirServiceScheduleEntry[]>(SCHEDULE_FILE, []);
  return entries
    .map((entry) => normalizeChoirScheduleEntry(entry))
    .sort(
      (a, b) =>
        a.serviceDate.localeCompare(b.serviceDate) ||
        a.serviceTime.localeCompare(b.serviceTime),
    );
}

export async function saveChoirServiceSchedule(input: {
  id?: string;
  serviceDate: string;
  serviceTime: string;
  program: ChoirServiceScheduleEntry["program"];
  assignments: ChoirScheduleAssignment[];
  notes?: string;
  actor: { id: string; name: string };
}) {
  const entries = await readJson<ChoirServiceScheduleEntry[]>(SCHEDULE_FILE, []);
  const now = new Date().toISOString();
  const id = input.id?.trim() || `css-${Date.now()}`;

  const entry = normalizeChoirScheduleEntry({
    id,
    serviceDate: input.serviceDate.trim(),
    serviceTime: input.serviceTime.trim(),
    program: input.program,
    assignments: input.assignments,
    notes: input.notes?.trim() || undefined,
    createdAt: entries.find((item) => item.id === id)?.createdAt ?? now,
    updatedAt: now,
    createdBy: input.actor.id,
    createdByName: input.actor.name,
  });

  const index = entries.findIndex((item) => item.id === id);
  if (index >= 0) {
    entries[index] = entry;
  } else {
    entries.push(entry);
  }

  await writeJson(SCHEDULE_FILE, entries);
  return entry;
}

export async function deleteChoirServiceSchedule(id: string) {
  const entries = await readJson<ChoirServiceScheduleEntry[]>(SCHEDULE_FILE, []);
  const next = entries.filter((item) => item.id !== id);
  if (next.length === entries.length) return false;
  await writeJson(SCHEDULE_FILE, next);
  return true;
}
