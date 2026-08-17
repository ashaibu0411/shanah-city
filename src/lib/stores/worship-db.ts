import { prisma } from "@/lib/db";
import type {
  WorshipServicePlan,
  WorshipSong,
  WorshipTeamMember,
} from "@/lib/worship-types";
import {
  normalizeSongs,
  normalizeTeam,
  serviceTypeForTime,
} from "@/lib/worship-types";

function parseSongs(value: unknown): WorshipSong[] {
  if (!Array.isArray(value)) return [];
  return normalizeSongs(value as WorshipSong[]);
}

function parseTeam(value: unknown): WorshipTeamMember[] {
  if (!Array.isArray(value)) return [];
  return normalizeTeam(value as WorshipTeamMember[]);
}

function mapPlan(record: {
  id: string;
  serviceDate: string;
  serviceTime: string;
  serviceType: string;
  title: string | null;
  status: string;
  songs: unknown;
  team: unknown;
  rehearsalNotes: string | null;
  rehearsalDate: string | null;
  rehearsalTime: string | null;
  calendarEventId: string | null;
  reminderSentAt: Date | null;
  publishedAt: Date | null;
  createdBy: string;
  createdByName: string;
  createdAt: Date;
  updatedAt: Date;
}): WorshipServicePlan {
  return {
    id: record.id,
    serviceDate: record.serviceDate,
    serviceTime: record.serviceTime,
    serviceType: record.serviceType as WorshipServicePlan["serviceType"],
    title: record.title ?? undefined,
    status: record.status as WorshipServicePlan["status"],
    songs: parseSongs(record.songs),
    team: parseTeam(record.team),
    rehearsalNotes: record.rehearsalNotes ?? undefined,
    rehearsalDate: record.rehearsalDate ?? undefined,
    rehearsalTime: record.rehearsalTime ?? undefined,
    calendarEventId: record.calendarEventId ?? undefined,
    reminderSentAt: record.reminderSentAt?.toISOString(),
    publishedAt: record.publishedAt?.toISOString(),
    createdBy: record.createdBy,
    createdByName: record.createdByName,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  };
}

export async function listWorshipPlans(options?: {
  since?: string;
  until?: string;
  status?: WorshipServicePlan["status"];
}) {
  const where: {
    serviceDate?: { gte?: string; lte?: string };
    status?: string;
  } = {};

  if (options?.since || options?.until) {
    where.serviceDate = {};
    if (options.since) where.serviceDate.gte = options.since;
    if (options.until) where.serviceDate.lte = options.until;
  }

  if (options?.status) {
    where.status = options.status;
  }

  const records = await prisma.worshipServicePlan.findMany({
    where,
    orderBy: [{ serviceDate: "desc" }, { serviceTime: "asc" }],
  });

  return records.map(mapPlan);
}

export async function getWorshipPlan(serviceDate: string, serviceTime: string) {
  const record = await prisma.worshipServicePlan.findUnique({
    where: { serviceDate_serviceTime: { serviceDate, serviceTime } },
  });
  return record ? mapPlan(record) : null;
}

export async function saveWorshipPlan(input: {
  serviceDate: string;
  serviceTime: string;
  serviceType?: WorshipServicePlan["serviceType"];
  title?: string;
  songs: WorshipSong[];
  team: WorshipTeamMember[];
  rehearsalNotes?: string;
  rehearsalDate?: string;
  rehearsalTime?: string;
  calendarEventId?: string;
  status: WorshipServicePlan["status"];
  actor: { id: string; name: string };
}) {
  const now = new Date();
  const songs = normalizeSongs(input.songs);
  const team = normalizeTeam(input.team);
  const existing = await prisma.worshipServicePlan.findUnique({
    where: {
      serviceDate_serviceTime: {
        serviceDate: input.serviceDate,
        serviceTime: input.serviceTime,
      },
    },
  });

  const rehearsalChanged =
    existing &&
    (existing.rehearsalDate !== (input.rehearsalDate ?? null) ||
      existing.rehearsalTime !== (input.rehearsalTime ?? null));

  const data = {
    serviceType: input.serviceType ?? serviceTypeForTime(input.serviceTime),
    title: input.title?.trim() || null,
    songs,
    team,
    rehearsalNotes: input.rehearsalNotes?.trim() || null,
    rehearsalDate: input.rehearsalDate?.trim() || null,
    rehearsalTime: input.rehearsalTime?.trim() || null,
    calendarEventId: input.calendarEventId?.trim() || null,
    status: input.status,
    updatedAt: now,
    reminderSentAt: rehearsalChanged ? null : existing?.reminderSentAt ?? null,
    publishedAt:
      input.status === "published"
        ? existing?.publishedAt ?? now
        : input.status === "draft"
          ? null
          : existing?.publishedAt ?? null,
  };

  if (existing) {
    const record = await prisma.worshipServicePlan.update({
      where: { id: existing.id },
      data,
    });
    return mapPlan(record);
  }

  const record = await prisma.worshipServicePlan.create({
    data: {
      id: `worship-${Date.now()}`,
      serviceDate: input.serviceDate,
      serviceTime: input.serviceTime,
      createdBy: input.actor.id,
      createdByName: input.actor.name,
      createdAt: now,
      ...data,
    },
  });

  return mapPlan(record);
}

export async function updateWorshipMemberStatus(input: {
  serviceDate: string;
  serviceTime: string;
  userId: string;
  ready?: boolean;
  songId?: string;
  prepared?: boolean;
}) {
  const existing = await prisma.worshipServicePlan.findUnique({
    where: {
      serviceDate_serviceTime: {
        serviceDate: input.serviceDate,
        serviceTime: input.serviceTime,
      },
    },
  });

  if (!existing) return null;

  const songs = parseSongs(existing.songs);
  const team = parseTeam(existing.team);
  const memberIndex = team.findIndex((member) => member.userId === input.userId);
  if (memberIndex === -1) return null;

  if (typeof input.ready === "boolean") {
    team[memberIndex] = { ...team[memberIndex], ready: input.ready };
  }

  if (input.songId) {
    const songIndex = songs.findIndex((song) => song.id === input.songId);
    if (songIndex >= 0) {
      const preparedBy = new Set(songs[songIndex].preparedBy);
      if (input.prepared) {
        preparedBy.add(input.userId);
      } else {
        preparedBy.delete(input.userId);
      }
      songs[songIndex] = {
        ...songs[songIndex],
        preparedBy: [...preparedBy],
      };
    }
  }

  const record = await prisma.worshipServicePlan.update({
    where: { id: existing.id },
    data: {
      songs,
      team,
      updatedAt: new Date(),
    },
  });

  return mapPlan(record);
}

export async function markRehearsalReminderSent(serviceDate: string, serviceTime: string) {
  await prisma.worshipServicePlan.update({
    where: { serviceDate_serviceTime: { serviceDate, serviceTime } },
    data: { reminderSentAt: new Date() },
  });
}

export async function deleteWorshipPlan(serviceDate: string, serviceTime: string) {
  try {
    await prisma.worshipServicePlan.delete({
      where: { serviceDate_serviceTime: { serviceDate, serviceTime } },
    });
    return true;
  } catch {
    return false;
  }
}
