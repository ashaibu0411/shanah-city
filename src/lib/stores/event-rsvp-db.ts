import { prisma } from "@/lib/db";
import type { EventRsvpStatus } from "@/lib/event-rsvp-types";

function mapRsvp(record: {
  id: string;
  eventId: string;
  userId: string;
  userName: string;
  userEmail: string;
  status: string;
  note: string | null;
  updatedAt: Date;
  createdAt: Date;
}) {
  return {
    id: record.id,
    eventId: record.eventId,
    userId: record.userId,
    userName: record.userName,
    userEmail: record.userEmail,
    status: record.status as EventRsvpStatus,
    note: record.note ?? undefined,
    updatedAt: record.updatedAt.toISOString(),
    createdAt: record.createdAt.toISOString(),
  };
}

export async function getRsvpsForEvent(eventId: string) {
  const records = await prisma.eventRsvp.findMany({
    where: { eventId },
    orderBy: [{ status: "asc" }, { userName: "asc" }],
  });
  return records.map(mapRsvp);
}

export async function getRsvpForUser(eventId: string, userId: string) {
  const record = await prisma.eventRsvp.findUnique({
    where: { eventId_userId: { eventId, userId } },
  });
  return record ? mapRsvp(record) : null;
}

export async function upsertEventRsvp(input: {
  eventId: string;
  userId: string;
  userName: string;
  userEmail: string;
  status: EventRsvpStatus;
  note?: string;
}) {
  const record = await prisma.eventRsvp.upsert({
    where: { eventId_userId: { eventId: input.eventId, userId: input.userId } },
    create: {
      id: `rsvp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      eventId: input.eventId,
      userId: input.userId,
      userName: input.userName,
      userEmail: input.userEmail,
      status: input.status,
      note: input.note?.trim() || null,
    },
    update: {
      status: input.status,
      note: input.note?.trim() || null,
      userName: input.userName,
      userEmail: input.userEmail,
    },
  });
  return mapRsvp(record);
}

export async function deleteRsvpsForEvent(eventId: string) {
  const result = await prisma.eventRsvp.deleteMany({ where: { eventId } });
  return result.count;
}
