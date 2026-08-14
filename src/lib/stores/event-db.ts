import { prisma } from "@/lib/db";
import { upcomingEvents } from "@/lib/site";
import type { ChurchEvent } from "@/lib/types";

function mapEvent(record: {
  id: string;
  title: string;
  date: string;
  time: string;
  location: string;
  campusId: string | null;
  published: boolean;
  sortOrder: number;
}): ChurchEvent {
  return {
    id: record.id,
    title: record.title,
    date: record.date,
    time: record.time,
    location: record.location,
    campusId: record.campusId ?? undefined,
    published: record.published,
    sortOrder: record.sortOrder,
  };
}

function defaultEvents(): ChurchEvent[] {
  return upcomingEvents.map((event, index) => ({
    ...event,
    published: true,
    sortOrder: index,
  }));
}

async function ensureDefaultEvents() {
  const count = await prisma.churchEvent.count();
  if (count > 0) return;

  const now = new Date();
  await prisma.churchEvent.createMany({
    data: defaultEvents().map((event) => ({
      id: event.id,
      title: event.title,
      date: event.date,
      time: event.time,
      location: event.location,
      campusId: event.campusId ?? null,
      published: event.published ?? true,
      sortOrder: event.sortOrder ?? 0,
      createdAt: now,
      updatedAt: now,
    })),
  });
}

export async function getEvents(options?: { includeUnpublished?: boolean }) {
  await ensureDefaultEvents();

  const records = await prisma.churchEvent.findMany({
    where: options?.includeUnpublished ? undefined : { published: true },
    orderBy: [{ sortOrder: "asc" }, { title: "asc" }],
  });

  return records.map(mapEvent);
}

export async function createEvent(
  input: Omit<ChurchEvent, "id" | "sortOrder"> & { sortOrder?: number },
) {
  const now = new Date();
  const events = await getEvents({ includeUnpublished: true });
  const record = await prisma.churchEvent.create({
    data: {
      id: `event-${Date.now()}`,
      title: input.title,
      date: input.date,
      time: input.time,
      location: input.location,
      campusId: input.campusId ?? null,
      published: input.published ?? true,
      sortOrder: input.sortOrder ?? events.length,
      createdAt: now,
      updatedAt: now,
    },
  });

  return mapEvent(record);
}

export async function updateEvent(id: string, update: Partial<Omit<ChurchEvent, "id">>) {
  const existing = await prisma.churchEvent.findUnique({ where: { id } });
  if (!existing) return null;

  const record = await prisma.churchEvent.update({
    where: { id },
    data: {
      title: update.title,
      date: update.date,
      time: update.time,
      location: update.location,
      campusId: update.campusId === undefined ? undefined : update.campusId ?? null,
      published: update.published,
      sortOrder: update.sortOrder,
      updatedAt: new Date(),
    },
  });

  return mapEvent(record);
}

export async function deleteEvent(id: string) {
  try {
    await prisma.churchEvent.delete({ where: { id } });
    return true;
  } catch {
    return false;
  }
}
