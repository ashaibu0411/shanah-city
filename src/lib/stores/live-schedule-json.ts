import { promises as fs } from "fs";
import path from "path";
import type { LiveStreamSchedule, LiveStreamPlatform } from "@/lib/live-schedule-types";

const FILE = path.join(process.cwd(), "data", "live-schedule.json");
const SCHEDULE_ID = "upcoming";

async function readSchedule(): Promise<LiveStreamSchedule | null> {
  try {
    const raw = await fs.readFile(FILE, "utf-8");
    return JSON.parse(raw) as LiveStreamSchedule;
  } catch {
    return null;
  }
}

async function writeSchedule(schedule: LiveStreamSchedule | null) {
  await fs.mkdir(path.dirname(FILE), { recursive: true });
  if (!schedule) {
    try {
      await fs.unlink(FILE);
    } catch {
      // no file yet
    }
    return;
  }
  await fs.writeFile(FILE, JSON.stringify(schedule, null, 2));
}

export async function getUpcomingLiveStreamSchedule(now = new Date()) {
  const schedule = await readSchedule();
  if (!schedule) return null;
  if (new Date(schedule.startsAt) <= now) return null;
  return schedule;
}

export async function getLiveStreamSchedule() {
  return readSchedule();
}

export async function saveLiveStreamSchedule(input: {
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

  const existing = await readSchedule();
  const notifyChanged =
    existing &&
    (Boolean(existing.notifyEnabled) !== Boolean(input.notifyEnabled) ||
      (existing.notifyBody ?? null) !== (input.notifyBody?.trim() || null) ||
      existing.startsAt !== startsAt.toISOString());

  const schedule: LiveStreamSchedule = {
    id: SCHEDULE_ID,
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

  await writeSchedule(schedule);
  return schedule;
}

export async function markLiveStreamNotifySent() {
  const schedule = await readSchedule();
  if (!schedule) return;
  await writeSchedule({
    ...schedule,
    notifySentAt: new Date().toISOString(),
  });
}

export async function clearLiveStreamSchedule() {
  await writeSchedule(null);
  return true;
}
