import { prisma } from "@/lib/db";
import type { CoupleCalendarEventRecord, CoupleCalendarRecurrence } from "@/lib/couple-calendar-types";
import { parseCategory, parseRecurrence } from "@/lib/couple-calendar-utils";

function mapRecord(row: {
  id: string;
  coupleLinkId: string;
  createdBy: string;
  title: string;
  notes: string | null;
  category: string;
  startAt: Date;
  endAt: Date | null;
  allDay: boolean;
  timezone: string;
  recurrence: string | null;
  reminderMin: number | null;
  createdAt: Date;
  updatedAt: Date;
}): CoupleCalendarEventRecord {
  return {
    id: row.id,
    coupleLinkId: row.coupleLinkId,
    createdBy: row.createdBy,
    title: row.title,
    notes: row.notes ?? undefined,
    category: parseCategory(row.category),
    startAt: row.startAt.toISOString(),
    endAt: row.endAt?.toISOString(),
    allDay: row.allDay,
    timezone: row.timezone,
    recurrence: row.recurrence ? parseRecurrence(row.recurrence) : undefined,
    reminderMin: row.reminderMin ?? undefined,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export async function listCoupleCalendarEvents(coupleLinkId: string) {
  const rows = await prisma.coupleCalendarEvent.findMany({
    where: { coupleLinkId },
    orderBy: { startAt: "asc" },
  });
  return rows.map(mapRecord);
}

export async function getCoupleCalendarEventById(id: string) {
  const row = await prisma.coupleCalendarEvent.findUnique({ where: { id } });
  return row ? mapRecord(row) : null;
}

export async function createCoupleCalendarEvent(input: {
  coupleLinkId: string;
  createdBy: string;
  title: string;
  notes?: string;
  category: CoupleCalendarEventRecord["category"];
  startAt: string;
  endAt?: string;
  allDay: boolean;
  timezone: string;
  recurrence?: CoupleCalendarRecurrence;
  reminderMin?: number;
}) {
  const row = await prisma.coupleCalendarEvent.create({
    data: {
      id: `ccal-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      coupleLinkId: input.coupleLinkId,
      createdBy: input.createdBy,
      title: input.title.trim(),
      notes: input.notes?.trim() || null,
      category: input.category,
      startAt: new Date(input.startAt),
      endAt: input.endAt ? new Date(input.endAt) : null,
      allDay: input.allDay,
      timezone: input.timezone,
      recurrence: input.recurrence && input.recurrence !== "none" ? input.recurrence : null,
      reminderMin: input.reminderMin ?? null,
    },
  });
  return mapRecord(row);
}

export async function updateCoupleCalendarEvent(
  id: string,
  input: Partial<{
    title: string;
    notes: string | null;
    category: CoupleCalendarEventRecord["category"];
    startAt: string;
    endAt: string | null;
    allDay: boolean;
    timezone: string;
    recurrence: CoupleCalendarRecurrence | null;
    reminderMin: number | null;
  }>,
) {
  const row = await prisma.coupleCalendarEvent.update({
    where: { id },
    data: {
      ...(input.title !== undefined ? { title: input.title.trim() } : {}),
      ...(input.notes !== undefined ? { notes: input.notes } : {}),
      ...(input.category !== undefined ? { category: input.category } : {}),
      ...(input.startAt !== undefined ? { startAt: new Date(input.startAt) } : {}),
      ...(input.endAt !== undefined
        ? { endAt: input.endAt ? new Date(input.endAt) : null }
        : {}),
      ...(input.allDay !== undefined ? { allDay: input.allDay } : {}),
      ...(input.timezone !== undefined ? { timezone: input.timezone } : {}),
      ...(input.recurrence !== undefined
        ? {
            recurrence:
              input.recurrence && input.recurrence !== "none" ? input.recurrence : null,
          }
        : {}),
      ...(input.reminderMin !== undefined ? { reminderMin: input.reminderMin } : {}),
    },
  });
  return mapRecord(row);
}

export async function deleteCoupleCalendarEvent(id: string) {
  await prisma.coupleCalendarEvent.delete({ where: { id } });
}
