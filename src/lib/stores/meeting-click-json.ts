import { promises as fs } from "fs";
import path from "path";
import type { MeetingClickLog, MeetingClickSource } from "@/lib/meeting-click-types";

const CLICKS_FILE = path.join(process.cwd(), "data", "meeting-clicks.json");

async function readJson<T>(file: string, fallback: T): Promise<T> {
  try {
    const raw = await fs.readFile(file, "utf-8");
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

async function writeJson<T>(file: string, data: T) {
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(file, JSON.stringify(data, null, 2));
}

export async function logMeetingClick(input: {
  userId: string;
  userName: string;
  userEmail: string;
  meetingTitle: string;
  joinUrl: string;
  source: MeetingClickSource;
  meetingId?: string;
  groupId?: string;
  groupName?: string;
  campusId?: string;
  platform?: string;
}) {
  const clicks = await readJson<MeetingClickLog[]>(CLICKS_FILE, []);
  const record: MeetingClickLog = {
    id: `mclick-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    userId: input.userId,
    userName: input.userName,
    userEmail: input.userEmail,
    meetingId: input.meetingId,
    meetingTitle: input.meetingTitle,
    groupId: input.groupId,
    groupName: input.groupName,
    campusId: input.campusId,
    platform: input.platform,
    source: input.source,
    joinUrl: input.joinUrl,
    clickedAt: new Date().toISOString(),
  };

  clicks.unshift(record);
  await writeJson(CLICKS_FILE, clicks.slice(0, 5000));
  return record;
}

export async function getMeetingClicks(options?: {
  meetingId?: string;
  groupId?: string;
  userId?: string;
  since?: string;
  limit?: number;
}) {
  const clicks = await readJson<MeetingClickLog[]>(CLICKS_FILE, []);
  const sinceMs = options?.since ? new Date(options.since).getTime() : null;
  const limit = options?.limit ?? 100;

  return clicks
    .filter((click) => {
      if (options?.meetingId && click.meetingId !== options.meetingId) {
        return false;
      }
      if (options?.groupId && click.groupId !== options.groupId) {
        return false;
      }
      if (options?.userId && click.userId !== options.userId) {
        return false;
      }
      if (sinceMs && new Date(click.clickedAt).getTime() < sinceMs) {
        return false;
      }
      return true;
    })
    .slice(0, limit);
}
