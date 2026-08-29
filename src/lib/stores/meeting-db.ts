import { prisma } from "@/lib/db";
import { meetings as seedMeetings } from "@/lib/site";
import {
  canonicalMeetings,
  isAutomatedReminderMeeting,
  isLegacyMeeting,
} from "@/lib/meeting-catalog";
import {
  parseRecurringWeekdays,
  serializeRecurringWeekdays,
} from "@/lib/meeting-utils";
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
  recurringWeekdays: string | null;
  notifyEnabled: boolean;
  lastNotifiedOn: string | null;
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
    recurringWeekdays: parseRecurringWeekdays(record.recurringWeekdays),
    notifyEnabled: record.notifyEnabled,
    lastNotifiedOn: record.lastNotifiedOn ?? undefined,
    published: record.published,
    sortOrder: record.sortOrder,
  };
}

function defaultMeetings(): Meeting[] {
  return seedMeetings.map((meeting, index) => ({
    ...meeting,
    published: true,
    sortOrder: meeting.sortOrder ?? index,
  }));
}

function meetingWriteData(meeting: Meeting, now: Date) {
  return {
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
    recurringWeekdays: serializeRecurringWeekdays(meeting.recurringWeekdays),
    notifyEnabled: meeting.notifyEnabled ?? false,
    lastNotifiedOn: meeting.lastNotifiedOn ?? null,
    published: meeting.published ?? true,
    sortOrder: meeting.sortOrder ?? 0,
    createdAt: now,
    updatedAt: now,
  };
}

async function ensureDefaultMeetings() {
  const count = await prisma.meeting.count();
  if (count > 0) return;

  const now = new Date();
  await prisma.meeting.createMany({
    data: defaultMeetings().map((meeting) => meetingWriteData(meeting, now)),
  });
}

async function retireLegacyMeetings(now: Date) {
  await prisma.meeting.updateMany({
    where: {
      OR: [
        { id: { in: ["1", "2", "3", "4", "5"] } },
        {
          title: {
            in: [
              "Friday Evening Service",
              "Sunday Morning Service",
              "Prayer Ministry",
              "Watch Online",
              "Accra Campus Service",
            ],
          },
        },
      ],
      NOT: {
        id: { in: canonicalMeetings().map((meeting) => meeting.id) },
      },
    },
    data: { published: false, updatedAt: now },
  });
}

async function ensureCanonicalMeetings() {
  await ensureDefaultMeetings();

  const now = new Date();
  try {
    for (const canonical of canonicalMeetings()) {
      const existing = await prisma.meeting.findUnique({
        where: { id: canonical.id },
      });

      if (!existing) {
        await prisma.meeting.create({
          data: meetingWriteData(canonical, now),
        });
        continue;
      }

      await prisma.meeting.update({
        where: { id: canonical.id },
        data: {
          title: canonical.title,
          campusId: canonical.campusId,
          host: canonical.host,
          schedule: canonical.schedule,
          platform: canonical.platform,
          joinUrl: canonical.joinUrl ?? null,
          meetingId: canonical.meetingId ?? null,
          recurringWeekday: canonical.recurringWeekday ?? null,
          recurringWeekdays: serializeRecurringWeekdays(canonical.recurringWeekdays),
          published: true,
          sortOrder: canonical.sortOrder ?? existing.sortOrder,
          notifyEnabled: isAutomatedReminderMeeting(canonical.id) ? true : false,
          updatedAt: now,
        },
      });
    }
  } finally {
    await retireLegacyMeetings(now);
  }
}

export async function getMeetings(options?: { includeUnpublished?: boolean }) {
  await ensureCanonicalMeetings();

  const where = options?.includeUnpublished ? {} : { published: true };
  const records = await prisma.meeting.findMany({
    where,
    orderBy: [{ sortOrder: "asc" }, { title: "asc" }],
  });

  const meetings = records.map(mapMeeting);
  if (options?.includeUnpublished) {
    return meetings;
  }
  return meetings.filter((meeting) => !isLegacyMeeting(meeting));
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
      recurringWeekdays: serializeRecurringWeekdays(input.recurringWeekdays),
      notifyEnabled: input.notifyEnabled ?? false,
      lastNotifiedOn: input.lastNotifiedOn ?? null,
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
      recurringWeekdays:
        update.recurringWeekdays === undefined
          ? undefined
          : serializeRecurringWeekdays(update.recurringWeekdays),
      notifyEnabled: update.notifyEnabled,
      lastNotifiedOn:
        update.lastNotifiedOn === undefined ? undefined : update.lastNotifiedOn ?? null,
      published: update.published,
      sortOrder: update.sortOrder,
      updatedAt: new Date(),
    },
  });

  return mapMeeting(record);
}

export async function clearMeetingLastNotified(id: string) {
  const existing = await prisma.meeting.findUnique({ where: { id } });
  if (!existing) return null;

  const record = await prisma.meeting.update({
    where: { id },
    data: { lastNotifiedOn: null, updatedAt: new Date() },
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
  await ensureCanonicalMeetings();
  const record = await prisma.meeting.findUnique({ where: { id } });
  return record ? mapMeeting(record) : null;
}
