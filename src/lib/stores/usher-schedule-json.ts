import { promises as fs } from "fs";
import path from "path";
import type { UsherAssignment, UsherSchedule } from "@/lib/frontliners-types";
import { normalizeUshers, previousSundayIso } from "@/lib/frontliners-types";

const DATA_DIR = path.join(process.cwd(), "data");
const USHER_FILE = path.join(DATA_DIR, "usher-schedules.json");

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

async function readSchedules() {
  return readJson<UsherSchedule[]>(USHER_FILE, []);
}

function sortSchedules(schedules: UsherSchedule[]) {
  return [...schedules].sort(
    (left, right) =>
      right.serviceDate.localeCompare(left.serviceDate) ||
      left.serviceTime.localeCompare(right.serviceTime),
  );
}

function withNormalized(schedule: UsherSchedule): UsherSchedule {
  return { ...schedule, ushers: normalizeUshers(schedule.ushers) };
}

export async function listUsherSchedules(options?: { since?: string; until?: string }) {
  let schedules = sortSchedules(await readSchedules());
  if (options?.since) {
    schedules = schedules.filter((schedule) => schedule.serviceDate >= options.since!);
  }
  if (options?.until) {
    schedules = schedules.filter((schedule) => schedule.serviceDate <= options.until!);
  }
  return schedules.map(withNormalized);
}

export async function getUsherSchedule(serviceDate: string, serviceTime: string) {
  const schedules = await readSchedules();
  const schedule = schedules.find(
    (entry) => entry.serviceDate === serviceDate && entry.serviceTime === serviceTime,
  );
  return schedule ? withNormalized(schedule) : null;
}

export async function findPreviousUsherSchedule(serviceDate: string, serviceTime: string) {
  const schedules = sortSchedules(await readSchedules());
  const prevSundayIso = previousSundayIso(serviceDate);
  const exact = schedules.find(
    (schedule) => schedule.serviceDate === prevSundayIso && schedule.serviceTime === serviceTime,
  );
  if (exact) return withNormalized(exact);
  const fallback = schedules.find(
    (schedule) => schedule.serviceTime === serviceTime && schedule.serviceDate < serviceDate,
  );
  return fallback ? withNormalized(fallback) : null;
}

export async function saveUsherSchedule(input: {
  serviceDate: string;
  serviceTime: string;
  ushers: UsherAssignment[];
  notes?: string;
  status: UsherSchedule["status"];
  actor: { id: string; name: string };
}) {
  const schedules = await readSchedules();
  const index = schedules.findIndex(
    (schedule) =>
      schedule.serviceDate === input.serviceDate && schedule.serviceTime === input.serviceTime,
  );
  const now = new Date().toISOString();
  const ushers = normalizeUshers(input.ushers);

  if (index >= 0) {
    const existing = schedules[index];
    schedules[index] = withNormalized({
      ...existing,
      ushers,
      notes: input.notes,
      status: input.status,
      publishedAt:
        input.status === "published"
          ? existing.publishedAt ?? now
          : input.status === "draft"
            ? undefined
            : existing.publishedAt,
      updatedAt: now,
    });
    await writeJson(USHER_FILE, schedules);
    return schedules[index];
  }

  const schedule: UsherSchedule = withNormalized({
    id: `usher-${Date.now()}`,
    serviceDate: input.serviceDate,
    serviceTime: input.serviceTime,
    ushers,
    notes: input.notes,
    status: input.status,
    publishedAt: input.status === "published" ? now : undefined,
    createdBy: input.actor.id,
    createdByName: input.actor.name,
    createdAt: now,
    updatedAt: now,
  });
  schedules.push(schedule);
  await writeJson(USHER_FILE, schedules);
  return schedule;
}

export async function deleteUsherSchedule(serviceDate: string, serviceTime: string) {
  const schedules = await readSchedules();
  const next = schedules.filter(
    (schedule) =>
      !(schedule.serviceDate === serviceDate && schedule.serviceTime === serviceTime),
  );
  if (next.length === schedules.length) return false;
  await writeJson(USHER_FILE, next);
  return true;
}
