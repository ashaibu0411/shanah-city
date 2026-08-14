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

export async function getEvents(options?: { includeUnpublished?: boolean }) {
  const events = sortEvents(await readEvents());
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
