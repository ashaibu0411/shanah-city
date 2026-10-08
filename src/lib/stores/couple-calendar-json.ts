import { promises as fs } from "fs";
import path from "path";
import type { CoupleCalendarEventRecord, CoupleCalendarRecurrence } from "@/lib/couple-calendar-types";

const DATA_DIR = path.join(process.cwd(), "data");
const FILE = path.join(DATA_DIR, "couple-calendar-events.json");

async function readEvents() {
  try {
    const raw = await fs.readFile(FILE, "utf-8");
    return JSON.parse(raw) as CoupleCalendarEventRecord[];
  } catch {
    return [];
  }
}

async function writeEvents(events: CoupleCalendarEventRecord[]) {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(FILE, JSON.stringify(events, null, 2));
}

export async function listCoupleCalendarEvents(coupleLinkId: string) {
  const events = await readEvents();
  return events
    .filter((event) => event.coupleLinkId === coupleLinkId)
    .sort((a, b) => a.startAt.localeCompare(b.startAt));
}

export async function getCoupleCalendarEventById(id: string) {
  const events = await readEvents();
  return events.find((event) => event.id === id) ?? null;
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
  const events = await readEvents();
  const now = new Date().toISOString();
  const record: CoupleCalendarEventRecord = {
    id: `ccal-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    coupleLinkId: input.coupleLinkId,
    createdBy: input.createdBy,
    title: input.title.trim(),
    notes: input.notes?.trim() || undefined,
    category: input.category,
    startAt: input.startAt,
    endAt: input.endAt,
    allDay: input.allDay,
    timezone: input.timezone,
    recurrence: input.recurrence && input.recurrence !== "none" ? input.recurrence : undefined,
    reminderMin: input.reminderMin,
    createdAt: now,
    updatedAt: now,
  };
  events.push(record);
  await writeEvents(events);
  return record;
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
  const events = await readEvents();
  const index = events.findIndex((event) => event.id === id);
  if (index === -1) throw new Error("Event not found.");

  const current = events[index];
  events[index] = {
    ...current,
    ...(input.title !== undefined ? { title: input.title.trim() } : {}),
    ...(input.notes !== undefined ? { notes: input.notes ?? undefined } : {}),
    ...(input.category !== undefined ? { category: input.category } : {}),
    ...(input.startAt !== undefined ? { startAt: input.startAt } : {}),
    ...(input.endAt !== undefined ? { endAt: input.endAt ?? undefined } : {}),
    ...(input.allDay !== undefined ? { allDay: input.allDay } : {}),
    ...(input.timezone !== undefined ? { timezone: input.timezone } : {}),
    ...(input.recurrence !== undefined
      ? {
          recurrence:
            input.recurrence && input.recurrence !== "none" ? input.recurrence : undefined,
        }
      : {}),
    ...(input.reminderMin !== undefined ? { reminderMin: input.reminderMin ?? undefined } : {}),
    updatedAt: new Date().toISOString(),
  };
  await writeEvents(events);
  return events[index];
}

export async function deleteCoupleCalendarEvent(id: string) {
  const events = await readEvents();
  await writeEvents(events.filter((event) => event.id !== id));
}
