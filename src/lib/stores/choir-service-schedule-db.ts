import { prisma } from "@/lib/db";
import {
  normalizeChoirScheduleEntry,
  type ChoirScheduleAssignment,
  type ChoirServiceScheduleEntry,
} from "@/lib/choir-service-schedule-types";

function parseAssignments(value: unknown): ChoirScheduleAssignment[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((row) => {
      const item = row as { role?: string; personName?: string };
      if (
        !item.personName?.trim() ||
        (item.role !== "worship" &&
          item.role !== "praise" &&
          item.role !== "praise-worship" &&
          item.role !== "ministration-song")
      ) {
        return null;
      }
      return {
        role: item.role,
        personName: item.personName.trim(),
      };
    })
    .filter((item): item is ChoirScheduleAssignment => Boolean(item));
}

function mapRecord(record: {
  id: string;
  serviceDate: string;
  serviceTime: string;
  program: string;
  assignments: unknown;
  notes: string | null;
  createdBy: string | null;
  createdByName: string | null;
  createdAt: Date;
  updatedAt: Date;
}): ChoirServiceScheduleEntry {
  return normalizeChoirScheduleEntry({
    id: record.id,
    serviceDate: record.serviceDate,
    serviceTime: record.serviceTime,
    program: record.program as ChoirServiceScheduleEntry["program"],
    assignments: parseAssignments(record.assignments),
    notes: record.notes ?? undefined,
    createdBy: record.createdBy ?? undefined,
    createdByName: record.createdByName ?? undefined,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  });
}

export async function listChoirServiceSchedules() {
  const records = await prisma.choirServiceSchedule.findMany({
    orderBy: [{ serviceDate: "asc" }, { serviceTime: "asc" }],
  });
  return records.map(mapRecord);
}

export async function saveChoirServiceSchedule(input: {
  id?: string;
  serviceDate: string;
  serviceTime: string;
  program: ChoirServiceScheduleEntry["program"];
  assignments: ChoirScheduleAssignment[];
  notes?: string;
  actor: { id: string; name: string };
}) {
  const now = new Date();
  const id = input.id?.trim() || `css-${Date.now()}`;

  const record = await prisma.choirServiceSchedule.upsert({
    where: { id },
    create: {
      id,
      serviceDate: input.serviceDate.trim(),
      serviceTime: input.serviceTime.trim(),
      program: input.program,
      assignments: input.assignments,
      notes: input.notes?.trim() || null,
      createdBy: input.actor.id,
      createdByName: input.actor.name,
      createdAt: now,
      updatedAt: now,
    },
    update: {
      serviceDate: input.serviceDate.trim(),
      serviceTime: input.serviceTime.trim(),
      program: input.program,
      assignments: input.assignments,
      notes: input.notes?.trim() || null,
      updatedAt: now,
    },
  });

  return mapRecord(record);
}

export async function deleteChoirServiceSchedule(id: string) {
  try {
    await prisma.choirServiceSchedule.delete({ where: { id } });
    return true;
  } catch {
    return false;
  }
}
