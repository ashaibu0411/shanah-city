import { promises as fs } from "fs";
import path from "path";
import { meetings as seedMeetings } from "@/lib/site";
import type { Meeting } from "@/lib/types";

const DATA_DIR = path.join(process.cwd(), "data");
const MEETINGS_FILE = path.join(DATA_DIR, "meetings.json");

function defaultMeetings(): Meeting[] {
  return seedMeetings.map((meeting, index) => ({
    ...meeting,
    published: true,
    sortOrder: index,
  }));
}

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

async function readMeetings() {
  const meetings = await readJson<Meeting[]>(MEETINGS_FILE, []);
  if (meetings.length === 0) {
    const seeded = defaultMeetings();
    await writeJson(MEETINGS_FILE, seeded);
    return seeded;
  }
  return meetings;
}

function sortMeetings(meetings: Meeting[]) {
  return [...meetings].sort(
    (left, right) =>
      (left.sortOrder ?? 0) - (right.sortOrder ?? 0) ||
      left.title.localeCompare(right.title),
  );
}

export async function getMeetings(options?: { includeUnpublished?: boolean }) {
  let meetings = sortMeetings(await readMeetings());
  if (options?.includeUnpublished) {
    return meetings;
  }
  return meetings.filter((meeting) => meeting.published !== false);
}

export async function createMeeting(
  input: Omit<Meeting, "id" | "sortOrder"> & { sortOrder?: number },
) {
  const meetings = await readMeetings();
  const meeting: Meeting = {
    ...input,
    id: `meeting-${Date.now()}`,
    published: input.published ?? true,
    sortOrder: input.sortOrder ?? meetings.length,
  };
  meetings.push(meeting);
  await writeJson(MEETINGS_FILE, meetings);
  return meeting;
}

export async function updateMeeting(id: string, update: Partial<Omit<Meeting, "id">>) {
  const meetings = await readMeetings();
  const index = meetings.findIndex((meeting) => meeting.id === id);
  if (index === -1) return null;

  meetings[index] = { ...meetings[index], ...update };
  await writeJson(MEETINGS_FILE, meetings);
  return meetings[index];
}

export async function deleteMeeting(id: string) {
  const meetings = await readMeetings();
  const next = meetings.filter((meeting) => meeting.id !== id);
  if (next.length === meetings.length) return false;
  await writeJson(MEETINGS_FILE, next);
  return true;
}

export async function getMeetingById(id: string) {
  const meetings = await readMeetings();
  return meetings.find((meeting) => meeting.id === id) ?? null;
}
