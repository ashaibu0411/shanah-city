import { promises as fs } from "fs";
import path from "path";
import type { CommsCalendarItem, CommsRequest } from "@/lib/comms-types";

const REQUESTS_FILE = path.join(process.cwd(), "data", "comms-requests.json");
const CALENDAR_FILE = path.join(process.cwd(), "data", "comms-calendar.json");

async function readRequests() {
  try {
    const raw = await fs.readFile(REQUESTS_FILE, "utf-8");
    return JSON.parse(raw) as CommsRequest[];
  } catch {
    return [];
  }
}

async function writeRequests(requests: CommsRequest[]) {
  await fs.mkdir(path.dirname(REQUESTS_FILE), { recursive: true });
  await fs.writeFile(REQUESTS_FILE, JSON.stringify(requests, null, 2));
}

async function readCalendar() {
  try {
    const raw = await fs.readFile(CALENDAR_FILE, "utf-8");
    return JSON.parse(raw) as CommsCalendarItem[];
  } catch {
    return [];
  }
}

async function writeCalendar(items: CommsCalendarItem[]) {
  await fs.mkdir(path.dirname(CALENDAR_FILE), { recursive: true });
  await fs.writeFile(CALENDAR_FILE, JSON.stringify(items, null, 2));
}

export async function listCommsRequests() {
  const requests = await readRequests();
  return requests.sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
  );
}

export async function getCommsRequestById(id: string) {
  const requests = await readRequests();
  return requests.find((request) => request.id === id) ?? null;
}

export async function saveCommsRequest(
  input: Omit<CommsRequest, "id" | "createdAt" | "updatedAt"> & { id?: string },
) {
  const requests = await readRequests();
  const now = new Date().toISOString();
  const id = input.id ?? `comms-req-${Date.now()}`;
  const existingIndex = requests.findIndex((request) => request.id === id);
  const record: CommsRequest = {
    id,
    template: input.template,
    title: input.title.trim(),
    department: input.department?.trim() || undefined,
    description: input.description.trim(),
    targetAudience: input.targetAudience?.trim() || undefined,
    deliverables: input.deliverables.filter(Boolean),
    dueDate: input.dueDate,
    status: input.status,
    assigneeId: input.assigneeId,
    assigneeName: input.assigneeName?.trim() || undefined,
    requesterId: input.requesterId,
    requesterName: input.requesterName.trim(),
    requesterEmail: input.requesterEmail?.trim() || undefined,
    calendarItemId: input.calendarItemId,
    notes: input.notes?.trim() || undefined,
    createdAt: existingIndex === -1 ? now : requests[existingIndex].createdAt,
    updatedAt: now,
  };

  if (existingIndex === -1) {
    requests.unshift(record);
  } else {
    requests[existingIndex] = record;
  }

  await writeRequests(requests);
  return record;
}

export async function listCommsCalendarItems(weekStart?: string) {
  const items = await readCalendar();
  const filtered = weekStart
    ? items.filter((item) => item.weekStart === weekStart)
    : items;
  return filtered.sort(
    (a, b) => new Date(a.scheduledDate ?? a.weekStart).getTime() -
      new Date(b.scheduledDate ?? b.weekStart).getTime(),
  );
}

export async function getCommsCalendarItemById(id: string) {
  const items = await readCalendar();
  return items.find((item) => item.id === id) ?? null;
}

export async function saveCommsCalendarItem(
  input: Omit<CommsCalendarItem, "id" | "createdAt" | "updatedAt"> & { id?: string },
) {
  const items = await readCalendar();
  const now = new Date().toISOString();
  const id = input.id ?? `comms-cal-${Date.now()}`;
  const existingIndex = items.findIndex((item) => item.id === id);
  const record: CommsCalendarItem = {
    id,
    title: input.title.trim(),
    channel: input.channel,
    weekStart: input.weekStart,
    scheduledDate: input.scheduledDate,
    status: input.status,
    color: input.color,
    body: input.body?.trim() || undefined,
    requestId: input.requestId,
    assigneeId: input.assigneeId,
    assigneeName: input.assigneeName?.trim() || undefined,
    dueDate: input.dueDate,
    promotedAs: input.promotedAs,
    createdBy: input.createdBy,
    createdByName: input.createdByName.trim(),
    createdAt: existingIndex === -1 ? now : items[existingIndex].createdAt,
    updatedAt: now,
  };

  if (existingIndex === -1) {
    items.push(record);
  } else {
    items[existingIndex] = record;
  }

  await writeCalendar(items);
  return record;
}

export async function deleteCommsCalendarItem(id: string) {
  const items = await readCalendar();
  const next = items.filter((item) => item.id !== id);
  if (next.length === items.length) return false;
  await writeCalendar(next);
  return true;
}
