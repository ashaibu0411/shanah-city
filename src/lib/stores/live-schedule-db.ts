import { prisma } from "@/lib/db";
import type { LiveStreamSchedule, LiveStreamPlatform } from "@/lib/live-schedule-types";

const SCHEDULE_ID = "upcoming";

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

export async function getUpcomingLiveStreamSchedule(now = new Date()) {
  const record = await prisma.liveStreamSchedule.findUnique({
    where: { id: SCHEDULE_ID },
  });
  if (!record) return null;
  if (record.startsAt <= now) return null;
  return mapSchedule(record);
}

export async function getLiveStreamSchedule() {
  const record = await prisma.liveStreamSchedule.findUnique({
    where: { id: SCHEDULE_ID },
  });
  if (!record) return null;
  return mapSchedule(record);
}

export async function saveLiveStreamSchedule(input: {
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

  const existing = await prisma.liveStreamSchedule.findUnique({
    where: { id: SCHEDULE_ID },
  });

  const notifyChanged =
    existing &&
    (existing.notifyEnabled !== Boolean(input.notifyEnabled) ||
      existing.notifyBody !== (input.notifyBody?.trim() || null) ||
      existing.startsAt.getTime() !== startsAt.getTime());

  const record = await prisma.liveStreamSchedule.upsert({
    where: { id: SCHEDULE_ID },
    create: {
      id: SCHEDULE_ID,
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
    update: {
      title: input.title.trim(),
      startsAt,
      platform: input.platform ?? null,
      notifyEnabled: Boolean(input.notifyEnabled),
      notifyBody: input.notifyBody?.trim() || null,
      notifySentAt: notifyChanged ? null : existing?.notifySentAt ?? null,
      createdBy: input.createdBy,
      createdByName: input.createdByName,
      updatedAt: now,
    },
  });

  return mapSchedule(record);
}

export async function markLiveStreamNotifySent() {
  await prisma.liveStreamSchedule.update({
    where: { id: SCHEDULE_ID },
    data: { notifySentAt: new Date() },
  });
}

export async function clearLiveStreamSchedule() {
  try {
    await prisma.liveStreamSchedule.delete({ where: { id: SCHEDULE_ID } });
    return true;
  } catch {
    return false;
  }
}
