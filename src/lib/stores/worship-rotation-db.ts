import { prisma } from "@/lib/db";
import {
  defaultRotationConfig,
  type WorshipRotationPoolMember,
  type WorshipScheduleRotationConfig,
} from "@/lib/worship-types";

const ROTATION_ID = "default";

function parsePool(value: unknown): WorshipRotationPoolMember[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((entry) => {
      const row = entry as { userId?: string; name?: string };
      if (!row.userId?.trim() || !row.name?.trim()) return null;
      return { userId: row.userId.trim(), name: row.name.trim() };
    })
    .filter((entry): entry is WorshipRotationPoolMember => Boolean(entry));
}

function parseSkipDates(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.map((entry) => String(entry).trim()).filter(Boolean);
}

function mapRotation(record: {
  id: string;
  pool: unknown;
  serviceTime: string;
  serviceKind: string;
  rotationIndex: number;
  skipDates: unknown;
  weeksAhead: number;
  uploadDutyLeadDays: number;
  updatedBy: string | null;
  updatedByName: string | null;
  createdAt: Date;
  updatedAt: Date;
}): WorshipScheduleRotationConfig {
  return {
    id: record.id,
    pool: parsePool(record.pool),
    serviceTime: record.serviceTime,
    serviceKind: record.serviceKind === "friday" ? "friday" : "sunday",
    rotationIndex: record.rotationIndex,
    skipDates: parseSkipDates(record.skipDates),
    weeksAhead: record.weeksAhead,
    uploadDutyLeadDays: record.uploadDutyLeadDays,
    updatedBy: record.updatedBy,
    updatedByName: record.updatedByName,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  };
}

export async function getWorshipRotationConfig() {
  const record = await prisma.worshipScheduleRotation.findUnique({
    where: { id: ROTATION_ID },
  });
  return record ? mapRotation(record) : defaultRotationConfig();
}

export async function saveWorshipRotationConfig(input: {
  pool: WorshipRotationPoolMember[];
  serviceTime: string;
  serviceKind: "sunday" | "friday";
  rotationIndex?: number;
  skipDates?: string[];
  weeksAhead?: number;
  uploadDutyLeadDays?: number;
  actor: { id: string; name: string };
}) {
  const now = new Date();
  const existing = await prisma.worshipScheduleRotation.findUnique({
    where: { id: ROTATION_ID },
  });

  const data = {
    pool: input.pool,
    serviceTime: input.serviceTime,
    serviceKind: input.serviceKind,
    rotationIndex: input.rotationIndex ?? existing?.rotationIndex ?? 0,
    skipDates: input.skipDates ?? parseSkipDates(existing?.skipDates),
    weeksAhead: input.weeksAhead ?? existing?.weeksAhead ?? 8,
    uploadDutyLeadDays: input.uploadDutyLeadDays ?? existing?.uploadDutyLeadDays ?? 4,
    updatedBy: input.actor.id,
    updatedByName: input.actor.name,
    updatedAt: now,
  };

  if (existing) {
    const record = await prisma.worshipScheduleRotation.update({
      where: { id: ROTATION_ID },
      data,
    });
    return mapRotation(record);
  }

  const record = await prisma.worshipScheduleRotation.create({
    data: {
      id: ROTATION_ID,
      createdAt: now,
      ...data,
    },
  });
  return mapRotation(record);
}

export async function updateWorshipRotationIndex(rotationIndex: number) {
  const existing = await prisma.worshipScheduleRotation.findUnique({
    where: { id: ROTATION_ID },
  });
  if (!existing) return;

  await prisma.worshipScheduleRotation.update({
    where: { id: ROTATION_ID },
    data: { rotationIndex, updatedAt: new Date() },
  });
}
