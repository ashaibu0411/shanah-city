import { prisma } from "@/lib/db";
import {
  normalizeGroupScheduleEntry,
  type GroupScheduleAssignment,
  type GroupServiceScheduleEntry,
} from "@/lib/choir-service-schedule-types";

function parseAssignments(value: unknown): GroupScheduleAssignment[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((row) => {
      const item = row as { role?: string; personName?: string };
      if (!item.role?.trim() || !item.personName?.trim()) {
        return null;
      }
      return {
        role: item.role.trim(),
        personName: item.personName.trim(),
      };
    })
    .filter((item): item is GroupScheduleAssignment => Boolean(item));
}

function mapRecord(record: {
  id: string;
  groupId: string;
  serviceDate: string;
  serviceTime: string;
  program: string;
  assignments: unknown;
  notes: string | null;
  createdBy: string | null;
  createdByName: string | null;
  createdAt: Date;
  updatedAt: Date;
}): GroupServiceScheduleEntry {
  return normalizeGroupScheduleEntry(
    {
      id: record.id,
      groupId: record.groupId,
      serviceDate: record.serviceDate,
      serviceTime: record.serviceTime,
      program: record.program,
      assignments: parseAssignments(record.assignments),
      notes: record.notes ?? undefined,
      createdBy: record.createdBy ?? undefined,
      createdByName: record.createdByName ?? undefined,
      createdAt: record.createdAt.toISOString(),
      updatedAt: record.updatedAt.toISOString(),
    },
    record.groupId,
  );
}

export async function listGroupServiceSchedules(groupId: string) {
  const records = await prisma.choirServiceSchedule.findMany({
    where: { groupId },
    orderBy: [{ serviceDate: "asc" }, { serviceTime: "asc" }],
  });
  return records.map(mapRecord);
}

/** @deprecated Use listGroupServiceSchedules */
export async function listChoirServiceSchedules() {
  return listGroupServiceSchedules("group-choir");
}

export async function saveGroupServiceSchedule(input: {
  id?: string;
  groupId: string;
  serviceDate: string;
  serviceTime: string;
  program: string;
  assignments: GroupScheduleAssignment[];
  notes?: string;
  actor: { id: string; name: string };
}) {
  const now = new Date();
  const id = input.id?.trim() || `gss-${Date.now()}`;

  const record = await prisma.choirServiceSchedule.upsert({
    where: { id },
    create: {
      id,
      groupId: input.groupId,
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
      groupId: input.groupId,
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

/** @deprecated Use saveGroupServiceSchedule */
export const saveChoirServiceSchedule = saveGroupServiceSchedule;

export async function deleteGroupServiceSchedule(id: string, groupId: string) {
  try {
    const result = await prisma.choirServiceSchedule.deleteMany({
      where: { id, groupId },
    });
    return result.count > 0;
  } catch {
    return false;
  }
}

/** @deprecated Use deleteGroupServiceSchedule */
export async function deleteChoirServiceSchedule(id: string) {
  return deleteGroupServiceSchedule(id, "group-choir");
}
