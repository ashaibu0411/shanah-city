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
  groupId: string | null;
  groupName: string | null;
  startsOn: string | null;
  endsOn: string | null;
  recurringWeekday: number | null;
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
    groupId: record.groupId ?? undefined,
    groupName: record.groupName ?? undefined,
    startsOn: record.startsOn ?? undefined,
    endsOn: record.endsOn ?? undefined,
    recurringWeekday: record.recurringWeekday ?? undefined,
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
      startsOn: event.startsOn ?? null,
      endsOn: event.endsOn ?? null,
      recurringWeekday: event.recurringWeekday ?? null,
      published: event.published ?? true,
      sortOrder: event.sortOrder ?? 0,
      createdAt: now,
      updatedAt: now,
    })),
  });
}

export async function getEvents(options?: {
  includeUnpublished?: boolean;
  groupId?: string | null;
}) {
  await ensureDefaultEvents();

  const where: {
    published?: boolean;
    groupId?: string | null;
  } = {};

  if (!options?.includeUnpublished) {
    where.published = true;
  }

  if (options?.groupId !== undefined) {
    where.groupId = options.groupId;
  }

  const records = await prisma.churchEvent.findMany({
    where,
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
      groupId: input.groupId ?? null,
      groupName: input.groupName ?? null,
      startsOn: input.startsOn ?? null,
      endsOn: input.endsOn ?? null,
      recurringWeekday: input.recurringWeekday ?? null,
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
      groupId: update.groupId === undefined ? undefined : update.groupId ?? null,
      groupName: update.groupName === undefined ? undefined : update.groupName ?? null,
      startsOn: update.startsOn === undefined ? undefined : update.startsOn ?? null,
      endsOn: update.endsOn === undefined ? undefined : update.endsOn ?? null,
      recurringWeekday:
        update.recurringWeekday === undefined
          ? undefined
          : update.recurringWeekday ?? null,
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

export async function upsertEvent(event: ChurchEvent) {
  const now = new Date();
  const record = await prisma.churchEvent.upsert({
    where: { id: event.id },
    create: {
      id: event.id,
      title: event.title,
      date: event.date,
      time: event.time,
      location: event.location,
      campusId: event.campusId ?? null,
      groupId: event.groupId ?? null,
      groupName: event.groupName ?? null,
      startsOn: event.startsOn ?? null,
      endsOn: event.endsOn ?? null,
      recurringWeekday: event.recurringWeekday ?? null,
      published: event.published ?? true,
      sortOrder: event.sortOrder ?? 0,
      createdAt: now,
      updatedAt: now,
    },
    update: {
      title: event.title,
      date: event.date,
      time: event.time,
      location: event.location,
      campusId: event.campusId ?? null,
      groupId: event.groupId ?? null,
      groupName: event.groupName ?? null,
      startsOn: event.startsOn ?? null,
      endsOn: event.endsOn ?? null,
      recurringWeekday: event.recurringWeekday ?? null,
      published: event.published ?? true,
      sortOrder: event.sortOrder,
      updatedAt: now,
    },
  });

  return mapEvent(record);
}
