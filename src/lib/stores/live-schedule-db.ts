import { prisma } from "@/lib/db";
import type { LiveStreamSchedule, LiveStreamPlatform } from "@/lib/live-schedule-types";
import {
  filterUpcomingLiveStreamSchedules,
  resolvePublicLiveStreamDisplay,
  sortLiveStreamSchedules,
} from "@/lib/live-schedule-utils";

function mapSchedule(record: {
  id: string;
  title: string;
  startsAt: Date;
  platform: string | null;
  notifyEnabled: boolean;
  notifyBody: string | null;
  notifySentAt: Date | null;
  createdBy: string;
  createdByName: string;
  updatedAt: Date;
}): LiveStreamSchedule {
  return {
    id: record.id,
    title: record.title,
    startsAt: record.startsAt.toISOString(),
    platform: (record.platform as LiveStreamPlatform | null) ?? undefined,
    notifyEnabled: record.notifyEnabled,
    notifyBody: record.notifyBody,
    notifySentAt: record.notifySentAt?.toISOString() ?? null,
    createdBy: record.createdBy,
    createdByName: record.createdByName,
    updatedAt: record.updatedAt.toISOString(),
  };
}

export async function getPublicLiveStreamSchedule(now = new Date()) {
  const records = await prisma.liveStreamSchedule.findMany({
    orderBy: { startsAt: "asc" },
  });
  return resolvePublicLiveStreamDisplay(records.map(mapSchedule), now);
}

export async function getUpcomingLiveStreamSchedule(now = new Date()) {
  const records = await prisma.liveStreamSchedule.findMany({
    where: { startsAt: { gt: now } },
    orderBy: { startsAt: "asc" },
    take: 1,
  });
  if (!records[0]) return null;
  return mapSchedule(records[0]);
}

export async function getUpcomingLiveStreamSchedules(now = new Date()) {
  const records = await prisma.liveStreamSchedule.findMany({
    where: { startsAt: { gt: now } },
    orderBy: { startsAt: "asc" },
  });
  return records.map(mapSchedule);
}

export async function getLiveStreamSchedules() {
  const records = await prisma.liveStreamSchedule.findMany({
    orderBy: { startsAt: "asc" },
  });
  return records.map(mapSchedule);
}

/** @deprecated Use getLiveStreamSchedules */
export async function getLiveStreamSchedule() {
  const record = await prisma.liveStreamSchedule.findFirst({
    orderBy: { startsAt: "asc" },
  });
  if (!record) return null;
  return mapSchedule(record);
}

export async function saveLiveStreamSchedule(input: {
  id?: string;
  title: string;
  startsAt: string;
  platform?: LiveStreamPlatform;
  notifyEnabled?: boolean;
  notifyBody?: string;
  createdBy: string;
  createdByName: string;
}) {
  const now = new Date();
  const startsAt = new Date(input.startsAt);
  if (Number.isNaN(startsAt.getTime())) {
    throw new Error("Choose a valid date and time.");
  }
  if (startsAt <= now) {
    throw new Error("The livestream must be scheduled in the future.");
  }

  const existing = input.id
    ? await prisma.liveStreamSchedule.findUnique({ where: { id: input.id } })
    : null;

  const notifyChanged =
    existing &&
    (existing.notifyEnabled !== Boolean(input.notifyEnabled) ||
      existing.notifyBody !== (input.notifyBody?.trim() || null) ||
      existing.startsAt.getTime() !== startsAt.getTime());

  if (existing) {
    const record = await prisma.liveStreamSchedule.update({
      where: { id: existing.id },
      data: {
        title: input.title.trim(),
        startsAt,
        platform: input.platform ?? null,
        notifyEnabled: Boolean(input.notifyEnabled),
        notifyBody: input.notifyBody?.trim() || null,
        notifySentAt: notifyChanged ? null : existing.notifySentAt,
        createdBy: input.createdBy,
        createdByName: input.createdByName,
        updatedAt: now,
      },
    });
    return mapSchedule(record);
  }

  const record = await prisma.liveStreamSchedule.create({
    data: {
      title: input.title.trim(),
      startsAt,
      platform: input.platform ?? null,
      notifyEnabled: Boolean(input.notifyEnabled),
      notifyBody: input.notifyBody?.trim() || null,
      notifySentAt: null,
      createdBy: input.createdBy,
      createdByName: input.createdByName,
      updatedAt: now,
    },
  });

  return mapSchedule(record);
}

export async function markLiveStreamNotifySent(id: string) {
  try {
    await prisma.liveStreamSchedule.update({
      where: { id },
      data: { notifySentAt: new Date() },
    });
  } catch {
    // schedule removed or id stale
  }
}

export async function clearLiveStreamSchedule(id?: string) {
  if (id) {
    try {
      await prisma.liveStreamSchedule.delete({ where: { id } });
      return true;
    } catch {
      return false;
    }
  }
  await prisma.liveStreamSchedule.deleteMany();
  return true;
}
