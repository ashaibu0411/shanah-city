import { prisma } from "@/lib/db";
import { Prisma } from "@prisma/client";
import type { CommsCalendarItem, CommsPromotedAs, CommsRequest } from "@/lib/comms-types";

function parseDeliverables(value: unknown) {
  return Array.isArray(value) ? value.filter((entry) => typeof entry === "string") : [];
}

function parsePromotedAs(value: unknown): CommsPromotedAs | undefined {
  if (!value || typeof value !== "object") return undefined;
  const record = value as CommsPromotedAs;
  return {
    urgentAlertId: record.urgentAlertId,
    communityPostId: record.communityPostId,
    pushSentAt: record.pushSentAt,
  };
}

function mapRequest(record: {
  id: string;
  template: string;
  title: string;
  department: string | null;
  description: string;
  targetAudience: string | null;
  deliverables: unknown;
  dueDate: Date | null;
  status: string;
  assigneeId: string | null;
  assigneeName: string | null;
  requesterId: string;
  requesterName: string;
  requesterEmail: string | null;
  calendarItemId: string | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}): CommsRequest {
  return {
    id: record.id,
    template: record.template as CommsRequest["template"],
    title: record.title,
    department: record.department ?? undefined,
    description: record.description,
    targetAudience: record.targetAudience ?? undefined,
    deliverables: parseDeliverables(record.deliverables),
    dueDate: record.dueDate?.toISOString(),
    status: record.status as CommsRequest["status"],
    assigneeId: record.assigneeId ?? undefined,
    assigneeName: record.assigneeName ?? undefined,
    requesterId: record.requesterId,
    requesterName: record.requesterName,
    requesterEmail: record.requesterEmail ?? undefined,
    calendarItemId: record.calendarItemId ?? undefined,
    notes: record.notes ?? undefined,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  };
}

function mapCalendarItem(record: {
  id: string;
  title: string;
  channel: string;
  weekStart: Date;
  scheduledDate: Date | null;
  status: string;
  color: string | null;
  body: string | null;
  requestId: string | null;
  assigneeId: string | null;
  assigneeName: string | null;
  dueDate: Date | null;
  promotedAs: unknown;
  createdBy: string;
  createdByName: string;
  createdAt: Date;
  updatedAt: Date;
}): CommsCalendarItem {
  return {
    id: record.id,
    title: record.title,
    channel: record.channel as CommsCalendarItem["channel"],
    weekStart: record.weekStart.toISOString(),
    scheduledDate: record.scheduledDate?.toISOString(),
    status: record.status as CommsCalendarItem["status"],
    color: record.color ?? undefined,
    body: record.body ?? undefined,
    requestId: record.requestId ?? undefined,
    assigneeId: record.assigneeId ?? undefined,
    assigneeName: record.assigneeName ?? undefined,
    dueDate: record.dueDate?.toISOString(),
    promotedAs: parsePromotedAs(record.promotedAs),
    createdBy: record.createdBy,
    createdByName: record.createdByName,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  };
}

export async function listCommsRequests() {
  const records = await prisma.commsRequest.findMany({
    orderBy: { updatedAt: "desc" },
  });
  return records.map(mapRequest);
}

export async function getCommsRequestById(id: string) {
  const record = await prisma.commsRequest.findUnique({ where: { id } });
  return record ? mapRequest(record) : null;
}

export async function saveCommsRequest(
  input: Omit<CommsRequest, "id" | "createdAt" | "updatedAt"> & { id?: string },
) {
  const id = input.id ?? `comms-req-${Date.now()}`;
  const record = await prisma.commsRequest.upsert({
    where: { id },
    create: {
      id,
      template: input.template,
      title: input.title.trim(),
      department: input.department?.trim() || null,
      description: input.description.trim(),
      targetAudience: input.targetAudience?.trim() || null,
      deliverables: input.deliverables,
      dueDate: input.dueDate ? new Date(input.dueDate) : null,
      status: input.status,
      assigneeId: input.assigneeId ?? null,
      assigneeName: input.assigneeName?.trim() || null,
      requesterId: input.requesterId,
      requesterName: input.requesterName.trim(),
      requesterEmail: input.requesterEmail?.trim() || null,
      calendarItemId: input.calendarItemId ?? null,
      notes: input.notes?.trim() || null,
    },
    update: {
      template: input.template,
      title: input.title.trim(),
      department: input.department?.trim() || null,
      description: input.description.trim(),
      targetAudience: input.targetAudience?.trim() || null,
      deliverables: input.deliverables,
      dueDate: input.dueDate ? new Date(input.dueDate) : null,
      status: input.status,
      assigneeId: input.assigneeId ?? null,
      assigneeName: input.assigneeName?.trim() || null,
      requesterEmail: input.requesterEmail?.trim() || null,
      calendarItemId: input.calendarItemId ?? null,
      notes: input.notes?.trim() || null,
    },
  });
  return mapRequest(record);
}

export async function listCommsCalendarItems(weekStart?: string) {
  const records = await prisma.commsCalendarItem.findMany({
    where: weekStart ? { weekStart: new Date(weekStart) } : undefined,
    orderBy: [{ scheduledDate: "asc" }, { title: "asc" }],
  });
  return records.map(mapCalendarItem);
}

export async function getCommsCalendarItemById(id: string) {
  const record = await prisma.commsCalendarItem.findUnique({ where: { id } });
  return record ? mapCalendarItem(record) : null;
}

export async function saveCommsCalendarItem(
  input: Omit<CommsCalendarItem, "id" | "createdAt" | "updatedAt"> & { id?: string },
) {
  const id = input.id ?? `comms-cal-${Date.now()}`;
  const record = await prisma.commsCalendarItem.upsert({
    where: { id },
    create: {
      id,
      title: input.title.trim(),
      channel: input.channel,
      weekStart: new Date(input.weekStart),
      scheduledDate: input.scheduledDate ? new Date(input.scheduledDate) : null,
      status: input.status,
      color: input.color ?? null,
      body: input.body?.trim() || null,
      requestId: input.requestId ?? null,
      assigneeId: input.assigneeId ?? null,
      assigneeName: input.assigneeName?.trim() || null,
      dueDate: input.dueDate ? new Date(input.dueDate) : null,
      promotedAs: input.promotedAs ?? Prisma.JsonNull,
      createdBy: input.createdBy,
      createdByName: input.createdByName.trim(),
    },
    update: {
      title: input.title.trim(),
      channel: input.channel,
      weekStart: new Date(input.weekStart),
      scheduledDate: input.scheduledDate ? new Date(input.scheduledDate) : null,
      status: input.status,
      color: input.color ?? null,
      body: input.body?.trim() || null,
      requestId: input.requestId ?? null,
      assigneeId: input.assigneeId ?? null,
      assigneeName: input.assigneeName?.trim() || null,
      dueDate: input.dueDate ? new Date(input.dueDate) : null,
      promotedAs: input.promotedAs ?? Prisma.JsonNull,
    },
  });
  return mapCalendarItem(record);
}

export async function deleteCommsCalendarItem(id: string) {
  try {
    await prisma.commsCalendarItem.delete({ where: { id } });
    return true;
  } catch {
    return false;
  }
}
