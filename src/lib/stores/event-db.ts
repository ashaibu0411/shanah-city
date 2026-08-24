import { prisma } from "@/lib/db";
import { upcomingEvents } from "@/lib/site";
import type { ChurchEvent } from "@/lib/types";

type EventRecord = {
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
  artworkSquareUrl: string | null;
  artworkWideUrl: string | null;
  artworkBannerUrl: string | null;
  published: boolean;
  sortOrder: number;
  rsvpEnabled: boolean;
  rsvpAudience: string | null;
  rsvpGroupId: string | null;
  rsvpGroupName: string | null;
  rsvpDeadline: Date | null;
  rsvpCapacity: number | null;
  rsvpInstructions: string | null;
  rsvpLastNotifiedAt: Date | null;
};

function mapEvent(record: EventRecord): ChurchEvent {
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
    artworkSquareUrl: record.artworkSquareUrl ?? undefined,
    artworkWideUrl: record.artworkWideUrl ?? undefined,
    artworkBannerUrl: record.artworkBannerUrl ?? undefined,
    published: record.published,
    sortOrder: record.sortOrder,
    rsvpEnabled: record.rsvpEnabled,
    rsvpAudience: (record.rsvpAudience as ChurchEvent["rsvpAudience"]) ?? undefined,
    rsvpGroupId: record.rsvpGroupId ?? undefined,
    rsvpGroupName: record.rsvpGroupName ?? undefined,
    rsvpDeadline: record.rsvpDeadline?.toISOString() ?? undefined,
    rsvpCapacity: record.rsvpCapacity ?? undefined,
    rsvpInstructions: record.rsvpInstructions ?? undefined,
    rsvpLastNotifiedAt: record.rsvpLastNotifiedAt?.toISOString() ?? undefined,
  };
}

function rsvpDataFromInput(
  input: Partial<ChurchEvent>,
  existing?: EventRecord | null,
) {
  return {
    rsvpEnabled: input.rsvpEnabled ?? existing?.rsvpEnabled ?? false,
    rsvpAudience:
      input.rsvpAudience === undefined
        ? (existing?.rsvpAudience ?? null)
        : input.rsvpAudience ?? null,
    rsvpGroupId:
      input.rsvpGroupId === undefined
        ? (existing?.rsvpGroupId ?? null)
        : input.rsvpGroupId ?? null,
    rsvpGroupName:
      input.rsvpGroupName === undefined
        ? (existing?.rsvpGroupName ?? null)
        : input.rsvpGroupName ?? null,
    rsvpDeadline:
      input.rsvpDeadline === undefined
        ? (existing?.rsvpDeadline ?? null)
        : input.rsvpDeadline
          ? new Date(input.rsvpDeadline)
          : null,
    rsvpCapacity:
      input.rsvpCapacity === undefined
        ? (existing?.rsvpCapacity ?? null)
        : input.rsvpCapacity ?? null,
    rsvpInstructions:
      input.rsvpInstructions === undefined
        ? (existing?.rsvpInstructions ?? null)
        : input.rsvpInstructions ?? null,
    rsvpLastNotifiedAt:
      input.rsvpLastNotifiedAt === undefined
        ? (existing?.rsvpLastNotifiedAt ?? null)
        : input.rsvpLastNotifiedAt
          ? new Date(input.rsvpLastNotifiedAt)
          : null,
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

export async function getEventById(id: string) {
  await ensureDefaultEvents();
  const record = await prisma.churchEvent.findUnique({ where: { id } });
  return record ? mapEvent(record) : null;
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
  const rsvp = rsvpDataFromInput(input);
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
      ...rsvp,
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
      artworkSquareUrl:
        update.artworkSquareUrl === undefined
          ? undefined
          : update.artworkSquareUrl ?? null,
      artworkWideUrl:
        update.artworkWideUrl === undefined ? undefined : update.artworkWideUrl ?? null,
      artworkBannerUrl:
        update.artworkBannerUrl === undefined
          ? undefined
          : update.artworkBannerUrl ?? null,
      published: update.published,
      sortOrder: update.sortOrder,
      ...rsvpDataFromInput(update, existing),
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
  const existing = await prisma.churchEvent.findUnique({ where: { id: event.id } });
  const rsvp = rsvpDataFromInput(event, existing);
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
      artworkSquareUrl: event.artworkSquareUrl ?? null,
      artworkWideUrl: event.artworkWideUrl ?? null,
      artworkBannerUrl: event.artworkBannerUrl ?? null,
      published: event.published ?? true,
      sortOrder: event.sortOrder ?? 0,
      ...rsvp,
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
      artworkSquareUrl: event.artworkSquareUrl ?? null,
      artworkWideUrl: event.artworkWideUrl ?? null,
      artworkBannerUrl: event.artworkBannerUrl ?? null,
      published: event.published ?? true,
      sortOrder: event.sortOrder,
      ...rsvp,
      updatedAt: now,
    },
  });

  return mapEvent(record);
}
