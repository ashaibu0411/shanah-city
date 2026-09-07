import { randomUUID } from "crypto";
import { promises as fs } from "fs";
import path from "path";
import type { LiveStreamSchedule, LiveStreamPlatform } from "@/lib/live-schedule-types";
import {
  filterUpcomingLiveStreamSchedules,
  sortLiveStreamSchedules,
} from "@/lib/live-schedule-utils";

const FILE = path.join(process.cwd(), "data", "live-schedule.json");

async function readSchedules(): Promise<LiveStreamSchedule[]> {
  try {
    const raw = await fs.readFile(FILE, "utf-8");
    const parsed = JSON.parse(raw) as LiveStreamSchedule[] | LiveStreamSchedule;
    if (Array.isArray(parsed)) return parsed;
    if (parsed && typeof parsed === "object" && "startsAt" in parsed) {
      return [parsed];
    }
    return [];
  } catch {
    return [];
  }
}

async function writeSchedules(schedules: LiveStreamSchedule[]) {
  await fs.mkdir(path.dirname(FILE), { recursive: true });
  if (schedules.length === 0) {
    try {
      await fs.unlink(FILE);
    } catch {
      // no file yet
    }
    return;
  }
  await fs.writeFile(FILE, JSON.stringify(sortLiveStreamSchedules(schedules), null, 2));
}

export async function getUpcomingLiveStreamSchedule(now = new Date()) {
  const upcoming = filterUpcomingLiveStreamSchedules(await readSchedules(), now);
  return upcoming[0] ?? null;
}

export async function getUpcomingLiveStreamSchedules(now = new Date()) {
  return filterUpcomingLiveStreamSchedules(await readSchedules(), now);
}

export async function getLiveStreamSchedules() {
  return sortLiveStreamSchedules(await readSchedules());
}

/** @deprecated Use getLiveStreamSchedules — kept for notify migration */
export async function getLiveStreamSchedule() {
  const schedules = await getLiveStreamSchedules();
  return schedules[0] ?? null;
}

export async function saveLiveStreamSchedule(input: {
  id?: string;
  title: string;
  startsAt: string;
  platform?: LiveStreamPlatform;
  notifyEnabled?: boolean;
  notifyBody?: string;
  createdBy: string;
  createdByName: string;
}) {
  const startsAt = new Date(input.startsAt);
  const now = new Date();
  if (Number.isNaN(startsAt.getTime())) {
    throw new Error("Choose a valid date and time.");
  }
  if (startsAt <= now) {
    throw new Error("The livestream must be scheduled in the future.");
  }

  const schedules = await readSchedules();
  const existingIndex = input.id
    ? schedules.findIndex((item) => item.id === input.id)
    : -1;
  const existing = existingIndex >= 0 ? schedules[existingIndex] : null;

  const notifyChanged =
    existing &&
    (Boolean(existing.notifyEnabled) !== Boolean(input.notifyEnabled) ||
      (existing.notifyBody ?? null) !== (input.notifyBody?.trim() || null) ||
      existing.startsAt !== startsAt.toISOString());

  const schedule: LiveStreamSchedule = {
    id: existing?.id ?? input.id ?? randomUUID(),
    title: input.title.trim(),
    startsAt: startsAt.toISOString(),
    platform: input.platform,
    notifyEnabled: Boolean(input.notifyEnabled),
    notifyBody: input.notifyBody?.trim() || null,
    notifySentAt: notifyChanged ? null : existing?.notifySentAt ?? null,
    createdBy: input.createdBy,
    createdByName: input.createdByName,
    updatedAt: now.toISOString(),
  };

  const next =
    existingIndex >= 0
      ? schedules.map((item, index) => (index === existingIndex ? schedule : item))
      : [...schedules, schedule];

  await writeSchedules(next);
  return schedule;
}

export async function markLiveStreamNotifySent(id: string) {
  const schedules = await readSchedules();
  const index = schedules.findIndex((item) => item.id === id);
  if (index < 0) return;
  schedules[index] = {
    ...schedules[index],
    notifySentAt: new Date().toISOString(),
  };
  await writeSchedules(schedules);
}

export async function clearLiveStreamSchedule(id?: string) {
  if (!id) {
    await writeSchedules([]);
    return true;
  }
  const schedules = await readSchedules();
  const next = schedules.filter((item) => item.id !== id);
  await writeSchedules(next);
  return next.length !== schedules.length;
}
