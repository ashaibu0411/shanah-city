import { prisma } from "@/lib/db";
import {
  WORSHIP_SCHEDULE_WEEKS_AHEAD_DEFAULT,
  clampWorshipScheduleWeeksAhead,
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
  status: string;
  publishedAt: Date | null;
  scheduleNotifiedAt: Date | null;
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
    status: record.status === "published" ? "published" : "draft",
    publishedAt: record.publishedAt?.toISOString() ?? null,
    scheduleNotifiedAt: record.scheduleNotifiedAt?.toISOString() ?? null,
    updatedBy: record.updatedBy,
    updatedByName: record.updatedByName,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  };
}

function withPlanningHorizon(config: WorshipScheduleRotationConfig): WorshipScheduleRotationConfig {
  if (config.weeksAhead === 8) {
    return { ...config, weeksAhead: WORSHIP_SCHEDULE_WEEKS_AHEAD_DEFAULT };
  }
  return config;
}

export async function getWorshipRotationConfig() {
  const record = await prisma.worshipScheduleRotation.findUnique({
    where: { id: ROTATION_ID },
  });
  return withPlanningHorizon(record ? mapRotation(record) : defaultRotationConfig());
}

export async function saveWorshipRotationConfig(input: {
  pool: WorshipRotationPoolMember[];
  serviceTime: string;
  serviceKind: "sunday" | "friday";
  rotationIndex?: number;
  skipDates?: string[];
  weeksAhead?: number;
  uploadDutyLeadDays?: number;
  status?: "draft" | "published";
  publishedAt?: Date | null;
  scheduleNotifiedAt?: Date | null;
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
    weeksAhead:
      input.weeksAhead !== undefined
        ? clampWorshipScheduleWeeksAhead(input.weeksAhead)
        : existing?.weeksAhead ?? WORSHIP_SCHEDULE_WEEKS_AHEAD_DEFAULT,
    uploadDutyLeadDays: input.uploadDutyLeadDays ?? existing?.uploadDutyLeadDays ?? 4,
    status: input.status ?? existing?.status ?? "draft",
    publishedAt:
      input.publishedAt !== undefined ? input.publishedAt : existing?.publishedAt ?? null,
    scheduleNotifiedAt:
      input.scheduleNotifiedAt !== undefined
        ? input.scheduleNotifiedAt
        : existing?.scheduleNotifiedAt ?? null,
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
