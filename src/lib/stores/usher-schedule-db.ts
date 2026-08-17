import { prisma } from "@/lib/db";
import type { UsherAssignment, UsherSchedule } from "@/lib/frontliners-types";
import { normalizeUshers, previousSundayIso } from "@/lib/frontliners-types";

function parseUshers(value: unknown): UsherAssignment[] {
  if (!Array.isArray(value)) return [];
  return normalizeUshers(value as UsherAssignment[]);
}

function mapSchedule(record: {
  id: string;
  serviceDate: string;
  serviceTime: string;
  ushers: unknown;
  notes: string | null;
  status: string;
  publishedAt: Date | null;
  createdBy: string;
  createdByName: string;
  createdAt: Date;
  updatedAt: Date;
}): UsherSchedule {
  return {
    id: record.id,
    serviceDate: record.serviceDate,
    serviceTime: record.serviceTime,
    ushers: parseUshers(record.ushers),
    notes: record.notes,
    status: record.status as UsherSchedule["status"],
    publishedAt: record.publishedAt?.toISOString(),
    createdBy: record.createdBy,
    createdByName: record.createdByName,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  };
}

export async function listUsherSchedules(options?: { since?: string; until?: string }) {
  const where: { serviceDate?: { gte?: string; lte?: string } } = {};
  if (options?.since || options?.until) {
    where.serviceDate = {};
    if (options.since) where.serviceDate.gte = options.since;
    if (options.until) where.serviceDate.lte = options.until;
  }

  const records = await prisma.usherSchedule.findMany({
    where,
    orderBy: [{ serviceDate: "desc" }, { serviceTime: "asc" }],
  });
  return records.map(mapSchedule);
}

export async function getUsherSchedule(serviceDate: string, serviceTime: string) {
  const record = await prisma.usherSchedule.findUnique({
    where: { serviceDate_serviceTime: { serviceDate, serviceTime } },
  });
  return record ? mapSchedule(record) : null;
}

export async function findPreviousUsherSchedule(serviceDate: string, serviceTime: string) {
  const prevSundayIso = previousSundayIso(serviceDate);
  const exact = await prisma.usherSchedule.findUnique({
    where: { serviceDate_serviceTime: { serviceDate: prevSundayIso, serviceTime } },
  });
  if (exact) return mapSchedule(exact);

  const record = await prisma.usherSchedule.findFirst({
    where: { serviceTime, serviceDate: { lt: serviceDate } },
    orderBy: [{ serviceDate: "desc" }, { serviceTime: "asc" }],
  });
  return record ? mapSchedule(record) : null;
}

export async function saveUsherSchedule(input: {
  serviceDate: string;
  serviceTime: string;
  ushers: UsherAssignment[];
  notes?: string;
  status: UsherSchedule["status"];
  actor: { id: string; name: string };
}) {
  const now = new Date();
  const ushers = normalizeUshers(input.ushers);
  const existing = await prisma.usherSchedule.findUnique({
    where: {
      serviceDate_serviceTime: {
        serviceDate: input.serviceDate,
        serviceTime: input.serviceTime,
      },
    },
  });

  const data = {
    ushers,
    notes: input.notes?.trim() || null,
    status: input.status,
    updatedAt: now,
    publishedAt:
      input.status === "published"
        ? existing?.publishedAt ?? now
        : input.status === "draft"
          ? null
          : existing?.publishedAt ?? null,
  };

  if (existing) {
    const record = await prisma.usherSchedule.update({
      where: { id: existing.id },
      data,
    });
    return mapSchedule(record);
  }

  const record = await prisma.usherSchedule.create({
    data: {
      id: `usher-${Date.now()}`,
      serviceDate: input.serviceDate,
      serviceTime: input.serviceTime,
      createdBy: input.actor.id,
      createdByName: input.actor.name,
      createdAt: now,
      ...data,
    },
  });
  return mapSchedule(record);
}

export async function deleteUsherSchedule(serviceDate: string, serviceTime: string) {
  try {
    await prisma.usherSchedule.delete({
      where: { serviceDate_serviceTime: { serviceDate, serviceTime } },
    });
    return true;
  } catch {
    return false;
  }
}
