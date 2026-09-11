import { promises as fs } from "fs";
import path from "path";
import {
  defaultPrayerRotationConfig,
  parseScheduleSlotType,
  SCHEDULE_SLOT_TYPES,
  type PrayerAssignment,
  type PrayerRotationPoolMember,
  type PrayerScheduleRotationConfig,
  type ScheduleSlotType,
} from "@/lib/prayer-schedule-types";

const DATA_DIR = path.join(process.cwd(), "data");
const ROTATION_FILE = path.join(DATA_DIR, "prayer-schedule-rotations.json");
const ASSIGNMENTS_FILE = path.join(DATA_DIR, "prayer-assignments.json");

type RotationStore = Record<ScheduleSlotType, PrayerScheduleRotationConfig>;

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

async function readRotations(): Promise<RotationStore> {
  const stored = await readJson<Partial<RotationStore>>(ROTATION_FILE, {});
  return Object.fromEntries(
    SCHEDULE_SLOT_TYPES.map((slotType) => [
      slotType,
      stored[slotType] ?? defaultPrayerRotationConfig(slotType),
    ]),
  ) as RotationStore;
}

export async function getPrayerRotationConfig(slotType: ScheduleSlotType) {
  const rotations = await readRotations();
  return rotations[slotType];
}

export async function savePrayerRotationConfig(input: {
  slotType: ScheduleSlotType;
  pool: PrayerRotationPoolMember[];
  rotationIndex?: number;
  skipDates?: string[];
  weeksAhead?: number;
  status?: "draft" | "published";
  publishedAt?: Date | null;
  scheduleNotifiedAt?: Date | null;
  actor: { id: string; name: string };
}) {
  const rotations = await readRotations();
  const existing = rotations[input.slotType];
  const now = new Date().toISOString();

  rotations[input.slotType] = {
    ...existing,
    pool: input.pool,
    rotationIndex: input.rotationIndex ?? existing.rotationIndex,
    skipDates: input.skipDates ?? existing.skipDates,
    weeksAhead: input.weeksAhead ?? existing.weeksAhead,
    status: input.status ?? existing.status,
    publishedAt:
      input.publishedAt !== undefined
        ? input.publishedAt?.toISOString() ?? null
        : existing.publishedAt ?? null,
    scheduleNotifiedAt:
      input.scheduleNotifiedAt !== undefined
        ? input.scheduleNotifiedAt?.toISOString() ?? null
        : existing.scheduleNotifiedAt ?? null,
    updatedBy: input.actor.id,
    updatedByName: input.actor.name,
    updatedAt: now,
  };

  await writeJson(ROTATION_FILE, rotations);
  return rotations[input.slotType];
}

export async function listPrayerAssignments(options: {
  slotType?: ScheduleSlotType;
  since?: string;
  until?: string;
  userId?: string;
  status?: "draft" | "published";
}) {
  const assignments = await readJson<PrayerAssignment[]>(ASSIGNMENTS_FILE, []);
  return assignments
    .filter((entry) => {
      if (options.slotType && entry.slotType !== options.slotType) return false;
      if (options.userId && entry.userId !== options.userId) return false;
      if (options.status && entry.status !== options.status) return false;
      if (options.since && entry.assignmentDate < options.since) return false;
      if (options.until && entry.assignmentDate > options.until) return false;
      return true;
    })
    .map((entry) => ({
      ...entry,
      slotType: parseScheduleSlotType(entry.slotType) ?? entry.slotType,
    }))
    .sort((a, b) => a.assignmentDate.localeCompare(b.assignmentDate));
}

export async function getPrayerAssignment(slotType: ScheduleSlotType, assignmentDate: string) {
  const assignments = await listPrayerAssignments({ slotType, since: assignmentDate, until: assignmentDate });
  return assignments[0] ?? null;
}

export async function savePrayerAssignment(input: {
  slotType: ScheduleSlotType;
  assignmentDate: string;
  userId: string;
  userName: string;
  status?: "draft" | "published";
  publishedAt?: Date | null;
  notifiedAt?: Date | null;
}) {
  const assignments = await readJson<PrayerAssignment[]>(ASSIGNMENTS_FILE, []);
  const now = new Date().toISOString();
  const index = assignments.findIndex(
    (entry) => entry.slotType === input.slotType && entry.assignmentDate === input.assignmentDate,
  );

  const next: PrayerAssignment = {
    id: `${input.slotType}-${input.assignmentDate}`,
    slotType: input.slotType,
    assignmentDate: input.assignmentDate,
    userId: input.userId,
    userName: input.userName,
    status: input.status ?? assignments[index]?.status ?? "draft",
    publishedAt:
      input.publishedAt !== undefined
        ? input.publishedAt?.toISOString() ?? null
        : assignments[index]?.publishedAt ?? null,
    notifiedAt:
      input.notifiedAt !== undefined
        ? input.notifiedAt?.toISOString() ?? null
        : assignments[index]?.notifiedAt ?? null,
    createdAt: assignments[index]?.createdAt ?? now,
    updatedAt: now,
  };

  if (index >= 0) assignments[index] = next;
  else assignments.push(next);

  await writeJson(ASSIGNMENTS_FILE, assignments);
  return next;
}

export async function publishPrayerAssignments(slotType: ScheduleSlotType, since?: string) {
  const assignments = await readJson<PrayerAssignment[]>(ASSIGNMENTS_FILE, []);
  const now = new Date().toISOString();
  for (const entry of assignments) {
    if (entry.slotType !== slotType || entry.status !== "draft") continue;
    if (since && entry.assignmentDate < since) continue;
    entry.status = "published";
    entry.publishedAt = now;
    entry.updatedAt = now;
  }
  await writeJson(ASSIGNMENTS_FILE, assignments);
}

export async function markPrayerAssignmentsNotified(slotType: ScheduleSlotType, userIds: string[]) {
  if (userIds.length === 0) return;
  const assignments = await readJson<PrayerAssignment[]>(ASSIGNMENTS_FILE, []);
  const now = new Date().toISOString();
  for (const entry of assignments) {
    if (entry.slotType !== slotType || entry.status !== "published" || entry.notifiedAt) continue;
    if (!userIds.includes(entry.userId)) continue;
    entry.notifiedAt = now;
    entry.updatedAt = now;
  }
  await writeJson(ASSIGNMENTS_FILE, assignments);
}
