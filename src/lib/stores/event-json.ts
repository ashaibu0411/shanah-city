import { promises as fs } from "fs";
import path from "path";
import { upcomingEvents } from "@/lib/site";
import type { ChurchEvent } from "@/lib/types";

const DATA_DIR = path.join(process.cwd(), "data");
const EVENTS_FILE = path.join(DATA_DIR, "events.json");

function defaultEvents(): ChurchEvent[] {
  return upcomingEvents.map((event, index) => ({
    ...event,
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

async function readEvents() {
  const events = await readJson<ChurchEvent[]>(EVENTS_FILE, []);
  if (events.length === 0) {
    const seeded = defaultEvents();
    await writeJson(EVENTS_FILE, seeded);
    return seeded;
  }
  return events;
}

function sortEvents(events: ChurchEvent[]) {
  return [...events].sort(
    (left, right) =>
      (left.sortOrder ?? 0) - (right.sortOrder ?? 0) ||
      left.title.localeCompare(right.title),
  );
}

export async function getEventById(id: string) {
  const events = await readEvents();
  return events.find((event) => event.id === id) ?? null;
}

export async function getEvents(options?: {
  includeUnpublished?: boolean;
  groupId?: string | null;
}) {
  let events = sortEvents(await readEvents());

  if (options?.groupId !== undefined) {
    events = events.filter((event) => (event.groupId ?? null) === options.groupId);
  }

  if (options?.includeUnpublished) {
    return events;
  }
  return events.filter((event) => event.published !== false);
}

export async function createEvent(
  input: Omit<ChurchEvent, "id" | "sortOrder"> & { sortOrder?: number },
) {
  const events = await readEvents();
  const event: ChurchEvent = {
    ...input,
    id: `event-${Date.now()}`,
    published: input.published ?? true,
    sortOrder: input.sortOrder ?? events.length,
  };
  events.push(event);
  await writeJson(EVENTS_FILE, events);
  return event;
}

export async function updateEvent(id: string, update: Partial<Omit<ChurchEvent, "id">>) {
  const events = await readEvents();
  const index = events.findIndex((event) => event.id === id);
  if (index === -1) return null;

  events[index] = { ...events[index], ...update };
  await writeJson(EVENTS_FILE, events);
  return events[index];
}

export async function deleteEvent(id: string) {
  const events = await readEvents();
  const next = events.filter((event) => event.id !== id);
  if (next.length === events.length) return false;
  await writeJson(EVENTS_FILE, next);
  return true;
}

export async function upsertEvent(event: ChurchEvent) {
  const events = await readEvents();
  const index = events.findIndex((item) => item.id === event.id);
  if (index === -1) {
    events.push({
      ...event,
      published: event.published ?? true,
      sortOrder: event.sortOrder ?? events.length,
    });
  } else {
    events[index] = {
      ...events[index],
      ...event,
      id: events[index].id,
      rsvpEnabled: event.rsvpEnabled ?? events[index].rsvpEnabled ?? false,
      rsvpAudience: event.rsvpAudience ?? events[index].rsvpAudience,
      rsvpGroupId: event.rsvpGroupId ?? events[index].rsvpGroupId,
      rsvpGroupName: event.rsvpGroupName ?? events[index].rsvpGroupName,
      rsvpDeadline: event.rsvpDeadline ?? events[index].rsvpDeadline,
      rsvpCapacity: event.rsvpCapacity ?? events[index].rsvpCapacity,
      rsvpInstructions: event.rsvpInstructions ?? events[index].rsvpInstructions,
      rsvpLastNotifiedAt: event.rsvpLastNotifiedAt ?? events[index].rsvpLastNotifiedAt,
    };
  }
  await writeJson(EVENTS_FILE, events);
  return events.find((item) => item.id === event.id)!;
}
