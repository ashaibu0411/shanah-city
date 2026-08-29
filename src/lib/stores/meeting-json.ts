import { promises as fs } from "fs";
import path from "path";
import { meetings as seedMeetings } from "@/lib/site";
import { applyCanonicalMeeting, canonicalMeetings, isLegacyMeeting } from "@/lib/meeting-catalog";
import { parseRecurringWeekdays } from "@/lib/meeting-utils";
import type { Meeting } from "@/lib/types";

const DATA_DIR = path.join(process.cwd(), "data");
const MEETINGS_FILE = path.join(DATA_DIR, "meetings.json");

function normalizeMeeting(meeting: Meeting, index = 0): Meeting {
  return {
    ...meeting,
    recurringWeekdays: parseRecurringWeekdays(meeting.recurringWeekdays),
    notifyEnabled: meeting.notifyEnabled ?? false,
    published: meeting.published ?? true,
    sortOrder: meeting.sortOrder ?? index,
  };
}

function defaultMeetings(): Meeting[] {
  return seedMeetings.map((meeting, index) => normalizeMeeting(meeting, index));
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

async function ensureCanonicalMeetings(meetings: Meeting[]) {
  const next = meetings.map((meeting, index) => normalizeMeeting(meeting, index));

  for (const canonical of canonicalMeetings()) {
    const existingIndex = next.findIndex((meeting) => meeting.id === canonical.id);
    const existing = existingIndex === -1 ? undefined : next[existingIndex];
    const updated = normalizeMeeting(applyCanonicalMeeting(existing, canonical));
    if (existingIndex === -1) {
      next.push(updated);
    } else {
      next[existingIndex] = updated;
    }
  }

  for (const meeting of next) {
    if (isLegacyMeeting(meeting)) {
      meeting.published = false;
    }
  }

  return next;
}

async function readMeetings() {
  const meetings = await readJson<Meeting[]>(MEETINGS_FILE, []);
  const source = meetings.length === 0 ? defaultMeetings() : meetings;
  const next = await ensureCanonicalMeetings(source);
  if (JSON.stringify(next) !== JSON.stringify(source)) {
    await writeJson(MEETINGS_FILE, next);
  }
  return next;
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
  return meetings.filter(
    (meeting) => meeting.published !== false && !isLegacyMeeting(meeting),
  );
}

export async function createMeeting(
  input: Omit<Meeting, "id" | "sortOrder"> & { sortOrder?: number },
) {
  const meetings = await readMeetings();
  const meeting = normalizeMeeting(
    {
      ...input,
      id: `meeting-${Date.now()}`,
      published: input.published ?? true,
      sortOrder: input.sortOrder ?? meetings.length,
    },
    input.sortOrder ?? meetings.length,
  );
  meetings.push(meeting);
  await writeJson(MEETINGS_FILE, meetings);
  return meeting;
}

export async function updateMeeting(id: string, update: Partial<Omit<Meeting, "id">>) {
  const meetings = await readMeetings();
  const index = meetings.findIndex((meeting) => meeting.id === id);
  if (index === -1) return null;

  meetings[index] = normalizeMeeting({ ...meetings[index], ...update }, index);
  await writeJson(MEETINGS_FILE, meetings);
  return meetings[index];
}

export async function clearMeetingLastNotified(id: string) {
  return updateMeeting(id, { lastNotifiedOn: null });
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
