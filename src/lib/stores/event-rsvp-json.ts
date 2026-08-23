import { promises as fs } from "fs";
import path from "path";
import type { EventRsvpRecord, EventRsvpStatus } from "@/lib/event-rsvp-types";

const DATA_DIR = path.join(process.cwd(), "data");
const RSVPS_FILE = path.join(DATA_DIR, "event-rsvps.json");

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

async function readRsvps() {
  return readJson<EventRsvpRecord[]>(RSVPS_FILE, []);
}

export async function getRsvpsForEvent(eventId: string) {
  const rsvps = await readRsvps();
  return rsvps.filter((entry) => entry.eventId === eventId);
}

export async function getRsvpForUser(eventId: string, userId: string) {
  const rsvps = await readRsvps();
  return rsvps.find((entry) => entry.eventId === eventId && entry.userId === userId) ?? null;
}

export async function upsertEventRsvp(input: {
  eventId: string;
  userId: string;
  userName: string;
  userEmail: string;
  status: EventRsvpStatus;
  note?: string;
}) {
  const rsvps = await readRsvps();
  const now = new Date().toISOString();
  const index = rsvps.findIndex(
    (entry) => entry.eventId === input.eventId && entry.userId === input.userId,
  );

  if (index === -1) {
    const record: EventRsvpRecord = {
      id: `rsvp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      eventId: input.eventId,
      userId: input.userId,
      userName: input.userName,
      userEmail: input.userEmail,
      status: input.status,
      note: input.note?.trim() || undefined,
      createdAt: now,
      updatedAt: now,
    };
    rsvps.push(record);
    await writeJson(RSVPS_FILE, rsvps);
    return record;
  }

  rsvps[index] = {
    ...rsvps[index],
    status: input.status,
    note: input.note?.trim() || undefined,
    userName: input.userName,
    userEmail: input.userEmail,
    updatedAt: now,
  };
  await writeJson(RSVPS_FILE, rsvps);
  return rsvps[index];
}

export async function deleteRsvpsForEvent(eventId: string) {
  const rsvps = await readRsvps();
  const next = rsvps.filter((entry) => entry.eventId !== eventId);
  if (next.length === rsvps.length) return 0;
  await writeJson(RSVPS_FILE, next);
  return rsvps.length - next.length;
}
