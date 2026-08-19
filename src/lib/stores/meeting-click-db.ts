import { prisma } from "@/lib/db";
import type { MeetingClickLog, MeetingClickSource } from "@/lib/meeting-click-types";

function mapClick(record: {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  meetingId: string | null;
  meetingTitle: string;
  groupId: string | null;
  groupName: string | null;
  campusId: string | null;
  platform: string | null;
  source: string;
  joinUrl: string;
  clickedAt: Date;
}): MeetingClickLog {
  return {
    id: record.id,
    userId: record.userId,
    userName: record.userName,
    userEmail: record.userEmail,
    meetingId: record.meetingId ?? undefined,
    meetingTitle: record.meetingTitle,
    groupId: record.groupId ?? undefined,
    groupName: record.groupName ?? undefined,
    campusId: record.campusId ?? undefined,
    platform: record.platform ?? undefined,
    source: record.source as MeetingClickSource,
    joinUrl: record.joinUrl,
    clickedAt: record.clickedAt.toISOString(),
  };
}

export async function logMeetingClick(input: {
  userId: string;
  userName: string;
  userEmail: string;
  meetingTitle: string;
  joinUrl: string;
  source: MeetingClickSource;
  meetingId?: string;
  groupId?: string;
  groupName?: string;
  campusId?: string;
  platform?: string;
}) {
  const record = await prisma.meetingClick.create({
    data: {
      id: `mclick-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      userId: input.userId,
      userName: input.userName,
      userEmail: input.userEmail,
      meetingId: input.meetingId,
      meetingTitle: input.meetingTitle,
      groupId: input.groupId,
      groupName: input.groupName,
      campusId: input.campusId,
      platform: input.platform,
      source: input.source,
      joinUrl: input.joinUrl,
      clickedAt: new Date(),
    },
  });

  const count = await prisma.meetingClick.count();
  if (count > 5000) {
    const oldest = await prisma.meetingClick.findMany({
      orderBy: { clickedAt: "asc" },
      take: count - 5000,
      select: { id: true },
    });
    await prisma.meetingClick.deleteMany({
      where: { id: { in: oldest.map((item) => item.id) } },
    });
  }

  return mapClick(record);
}

export async function getMeetingClicks(options?: {
  meetingId?: string;
  meetingIds?: string[];
  groupId?: string;
  userId?: string;
  since?: string;
  limit?: number;
}) {
  const clicks = await prisma.meetingClick.findMany({
    where: {
      meetingId: options?.meetingId
        ? options.meetingId
        : options?.meetingIds
          ? { in: options.meetingIds }
          : undefined,
      groupId: options?.groupId,
      userId: options?.userId,
      clickedAt: options?.since ? { gte: new Date(options.since) } : undefined,
    },
    orderBy: { clickedAt: "desc" },
    take: options?.limit ?? 100,
  });

  return clicks.map(mapClick);
}
