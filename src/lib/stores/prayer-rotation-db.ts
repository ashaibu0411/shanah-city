import { prisma } from "@/lib/db";
import {
  defaultPrayerRotationConfig,
  parseScheduleSlotType,
  SCHEDULE_SLOT_TYPES,
  type PrayerAssignment,
  type PrayerRotationPoolMember,
  type PrayerScheduleRotationConfig,
  type ScheduleSlotType,
} from "@/lib/prayer-schedule-types";

function parsePool(value: unknown): PrayerRotationPoolMember[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((entry) => {
      const row = entry as { userId?: string; name?: string };
      if (!row.userId?.trim() || !row.name?.trim()) return null;
      return { userId: row.userId.trim(), name: row.name.trim() };
    })
    .filter((entry): entry is PrayerRotationPoolMember => Boolean(entry));
}

function parseSkipDates(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.map((entry) => String(entry).trim()).filter(Boolean);
}

function mapRotation(record: {
  slotType: string;
  pool: unknown;
  rotationIndex: number;
  skipDates: unknown;
  weeksAhead: number;
  status: string;
  publishedAt: Date | null;
  scheduleNotifiedAt: Date | null;
  updatedBy: string | null;
  updatedByName: string | null;
  createdAt: Date;
  updatedAt: Date;
}): PrayerScheduleRotationConfig {
  return {
    slotType: parseScheduleSlotType(record.slotType) ?? "morning",
    pool: parsePool(record.pool),
    rotationIndex: record.rotationIndex,
    skipDates: parseSkipDates(record.skipDates),
    weeksAhead: record.weeksAhead,
    status: record.status === "published" ? "published" : "draft",
    publishedAt: record.publishedAt?.toISOString() ?? null,
    scheduleNotifiedAt: record.scheduleNotifiedAt?.toISOString() ?? null,
    updatedBy: record.updatedBy,
    updatedByName: record.updatedByName,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  };
}

function mapAssignment(record: {
  id: string;
  slotType: string;
  assignmentDate: string;
  userId: string;
  userName: string;
  status: string;
  publishedAt: Date | null;
  notifiedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}): PrayerAssignment {
  return {
    id: record.id,
    slotType: parseScheduleSlotType(record.slotType) ?? "morning",
    assignmentDate: record.assignmentDate,
    userId: record.userId,
    userName: record.userName,
    status: record.status === "published" ? "published" : "draft",
    publishedAt: record.publishedAt?.toISOString() ?? null,
    notifiedAt: record.notifiedAt?.toISOString() ?? null,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  };
}

export async function getPrayerRotationConfig(slotType: ScheduleSlotType) {
  const record = await prisma.prayerScheduleRotation.findUnique({
    where: { slotType },
  });
  return record ? mapRotation(record) : defaultPrayerRotationConfig(slotType);
}

export async function savePrayerRotationConfig(input: {
  slotType: ScheduleSlotType;
  pool: PrayerRotationPoolMember[];
  rotationIndex?: number;
  skipDates?: string[];
  weeksAhead?: number;
  status?: "draft" | "published";
  publishedAt?: Date | null;
  scheduleNotifiedAt?: Date | null;
  actor: { id: string; name: string };
}) {
  const now = new Date();
  const existing = await prisma.prayerScheduleRotation.findUnique({
    where: { slotType: input.slotType },
  });

  const data = {
    pool: input.pool,
    rotationIndex: input.rotationIndex ?? existing?.rotationIndex ?? 0,
    skipDates: input.skipDates ?? parseSkipDates(existing?.skipDates),
    weeksAhead: input.weeksAhead ?? existing?.weeksAhead ?? 8,
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
    const record = await prisma.prayerScheduleRotation.update({
      where: { slotType: input.slotType },
      data,
    });
    return mapRotation(record);
  }

  const record = await prisma.prayerScheduleRotation.create({
    data: {
      id: input.slotType,
      slotType: input.slotType,
      createdAt: now,
      ...data,
    },
  });
  return mapRotation(record);
}

export async function listPrayerAssignments(options: {
  slotType?: ScheduleSlotType;
  since?: string;
  until?: string;
  userId?: string;
  status?: "draft" | "published";
}) {
  const where: {
    slotType?: string;
    assignmentDate?: { gte?: string; lte?: string };
    userId?: string;
    status?: string;
  } = {};

  if (options.slotType) where.slotType = options.slotType;
  if (options.userId) where.userId = options.userId;
  if (options.status) where.status = options.status;
  if (options.since || options.until) {
    where.assignmentDate = {};
    if (options.since) where.assignmentDate.gte = options.since;
    if (options.until) where.assignmentDate.lte = options.until;
  }

  const records = await prisma.prayerAssignment.findMany({
    where,
    orderBy: [{ assignmentDate: "asc" }],
  });
  return records.map(mapAssignment);
}

export async function getPrayerAssignment(slotType: ScheduleSlotType, assignmentDate: string) {
  const record = await prisma.prayerAssignment.findUnique({
    where: {
      slotType_assignmentDate: { slotType, assignmentDate },
    },
  });
  return record ? mapAssignment(record) : null;
}

export async function savePrayerAssignment(input: {
  slotType: ScheduleSlotType;
  assignmentDate: string;
  userId: string;
  userName: string;
  status?: "draft" | "published";
  publishedAt?: Date | null;
  notifiedAt?: Date | null;
}) {
  const now = new Date();
  const existing = await prisma.prayerAssignment.findUnique({
    where: {
      slotType_assignmentDate: {
        slotType: input.slotType,
        assignmentDate: input.assignmentDate,
      },
    },
  });

  const data = {
    userId: input.userId,
    userName: input.userName,
    status: input.status ?? existing?.status ?? "draft",
    publishedAt:
      input.publishedAt !== undefined ? input.publishedAt : existing?.publishedAt ?? null,
    notifiedAt: input.notifiedAt !== undefined ? input.notifiedAt : existing?.notifiedAt ?? null,
    updatedAt: now,
  };

  if (existing) {
    const record = await prisma.prayerAssignment.update({
      where: { id: existing.id },
      data,
    });
    return mapAssignment(record);
  }

  const record = await prisma.prayerAssignment.create({
    data: {
      id: `${input.slotType}-${input.assignmentDate}`,
      slotType: input.slotType,
      assignmentDate: input.assignmentDate,
      createdAt: now,
      ...data,
    },
  });
  return mapAssignment(record);
}

export async function publishPrayerAssignments(slotType: ScheduleSlotType, since?: string) {
  const now = new Date();
  const where: { slotType: string; status?: string; assignmentDate?: { gte: string } } = {
    slotType,
    status: "draft",
  };
  if (since) where.assignmentDate = { gte: since };

  await prisma.prayerAssignment.updateMany({
    where,
    data: {
      status: "published",
      publishedAt: now,
      updatedAt: now,
    },
  });
}

export async function markPrayerAssignmentsNotified(slotType: ScheduleSlotType, userIds: string[]) {
  if (userIds.length === 0) return;
  const now = new Date();
  await prisma.prayerAssignment.updateMany({
    where: {
      slotType,
      userId: { in: userIds },
      status: "published",
      notifiedAt: null,
    },
    data: {
      notifiedAt: now,
      updatedAt: now,
    },
  });
}
