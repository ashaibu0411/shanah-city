import { prisma } from "@/lib/db";
import { meetings as seedMeetings } from "@/lib/site";
import type { Meeting } from "@/lib/types";

function mapMeeting(record: {
  id: string;
  title: string;
  campusId: string;
  host: string;
  schedule: string;
  platform: string;
  joinUrl: string | null;
  location: string | null;
  meetingId: string | null;
  passcode: string | null;
  startsOn: string | null;
  endsOn: string | null;
  recurringWeekday: number | null;
  published: boolean;
  sortOrder: number;
}): Meeting {
  return {
    id: record.id,
    title: record.title,
    campusId: record.campusId,
    host: record.host,
    schedule: record.schedule,
    platform: record.platform as Meeting["platform"],
    joinUrl: record.joinUrl ?? undefined,
    location: record.location ?? undefined,
    meetingId: record.meetingId ?? undefined,
    passcode: record.passcode ?? undefined,
    startsOn: record.startsOn ?? undefined,
    endsOn: record.endsOn ?? undefined,
    recurringWeekday: record.recurringWeekday ?? undefined,
    published: record.published,
    sortOrder: record.sortOrder,
  };
}

function defaultMeetings(): Meeting[] {
  return seedMeetings.map((meeting, index) => ({
    ...meeting,
    published: true,
    sortOrder: index,
  }));
}

async function ensureDefaultMeetings() {
  const count = await prisma.meeting.count();
  if (count > 0) return;

  const now = new Date();
  await prisma.meeting.createMany({
    data: defaultMeetings().map((meeting) => ({
      id: meeting.id,
      title: meeting.title,
      campusId: meeting.campusId,
      host: meeting.host,
      schedule: meeting.schedule,
      platform: meeting.platform,
      joinUrl: meeting.joinUrl ?? null,
      location: meeting.location ?? null,
      meetingId: meeting.meetingId ?? null,
      passcode: meeting.passcode ?? null,
      startsOn: meeting.startsOn ?? null,
      endsOn: meeting.endsOn ?? null,
      recurringWeekday: meeting.recurringWeekday ?? null,
      published: meeting.published ?? true,
      sortOrder: meeting.sortOrder ?? 0,
      createdAt: now,
      updatedAt: now,
    })),
  });
}

export async function getMeetings(options?: { includeUnpublished?: boolean }) {
  await ensureDefaultMeetings();

  const where = options?.includeUnpublished ? {} : { published: true };
  const records = await prisma.meeting.findMany({
    where,
    orderBy: [{ sortOrder: "asc" }, { title: "asc" }],
  });

  return records.map(mapMeeting);
}

export async function createMeeting(
  input: Omit<Meeting, "id" | "sortOrder"> & { sortOrder?: number },
) {
  const now = new Date();
  const meetings = await getMeetings({ includeUnpublished: true });
  const record = await prisma.meeting.create({
    data: {
      id: `meeting-${Date.now()}`,
      title: input.title,
      campusId: input.campusId,
      host: input.host,
      schedule: input.schedule,
      platform: input.platform,
      joinUrl: input.joinUrl ?? null,
      location: input.location ?? null,
      meetingId: input.meetingId ?? null,
      passcode: input.passcode ?? null,
      startsOn: input.startsOn ?? null,
      endsOn: input.endsOn ?? null,
      recurringWeekday: input.recurringWeekday ?? null,
      published: input.published ?? true,
      sortOrder: input.sortOrder ?? meetings.length,
      createdAt: now,
      updatedAt: now,
    },
  });

  return mapMeeting(record);
}

export async function updateMeeting(id: string, update: Partial<Omit<Meeting, "id">>) {
  const existing = await prisma.meeting.findUnique({ where: { id } });
  if (!existing) return null;

  const record = await prisma.meeting.update({
    where: { id },
    data: {
      title: update.title,
      campusId: update.campusId,
      host: update.host,
      schedule: update.schedule,
      platform: update.platform,
      joinUrl: update.joinUrl === undefined ? undefined : update.joinUrl ?? null,
      location: update.location === undefined ? undefined : update.location ?? null,
      meetingId: update.meetingId === undefined ? undefined : update.meetingId ?? null,
      passcode: update.passcode === undefined ? undefined : update.passcode ?? null,
      startsOn: update.startsOn === undefined ? undefined : update.startsOn ?? null,
      endsOn: update.endsOn === undefined ? undefined : update.endsOn ?? null,
      recurringWeekday:
        update.recurringWeekday === undefined
          ? undefined
          : update.recurringWeekday ?? null,
      published: update.published,
      sortOrder: update.sortOrder,
      updatedAt: new Date(),
    },
  });

  return mapMeeting(record);
}

export async function deleteMeeting(id: string) {
  try {
    await prisma.meeting.delete({ where: { id } });
    return true;
  } catch {
    return false;
  }
}

export async function getMeetingById(id: string) {
  await ensureDefaultMeetings();
  const record = await prisma.meeting.findUnique({ where: { id } });
  return record ? mapMeeting(record) : null;
}
