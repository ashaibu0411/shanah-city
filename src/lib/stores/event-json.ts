import { readJsonFromData, writeJsonToData } from "@/lib/json-file-store";
import { upcomingEvents } from "@/lib/site";
import type { ChurchEvent } from "@/lib/types";

const EVENTS_FILENAME = "events.json";

function defaultEvents(): ChurchEvent[] {
  return upcomingEvents.map((event, index) => ({
    ...event,
    published: true,
    sortOrder: index,
  }));
}

async function readEvents() {
  const events = await readJsonFromData<ChurchEvent[]>(EVENTS_FILENAME, []);
  if (events.length > 0) return events;
  // Never seed by writing on serverless (bundle `data/` is read-only). Use in-memory defaults.
  return defaultEvents();
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
  await writeJsonToData(EVENTS_FILENAME, events);
  return event;
}

export async function updateEvent(id: string, update: Partial<Omit<ChurchEvent, "id">>) {
  const events = await readEvents();
  const index = events.findIndex((event) => event.id === id);
  if (index === -1) return null;

  events[index] = { ...events[index], ...update };
  await writeJsonToData(EVENTS_FILENAME, events);
  return events[index];
}

export async function deleteEvent(id: string) {
  const events = await readEvents();
  const next = events.filter((event) => event.id !== id);
  if (next.length === events.length) return false;
  await writeJsonToData(EVENTS_FILENAME, next);
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
  await writeJsonToData(EVENTS_FILENAME, events);
  return events.find((item) => item.id === event.id)!;
}
