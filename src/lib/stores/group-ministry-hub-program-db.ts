import { prisma } from "@/lib/db";
import type {
  MinistryHubBiblePlan,
  MinistryHubBiblePlanDay,
  MinistryHubBibleStudy,
  MinistryHubFaithChallenge,
} from "@/lib/group-ministry-hub-types";

function parseDays(json: string): MinistryHubBiblePlanDay[] {
  try {
    const parsed = JSON.parse(json) as MinistryHubBiblePlanDay[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function parseCompleted(json: string) {
  try {
    const parsed = JSON.parse(json) as number[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function getGroupBibleStudy(groupId: string) {
  const record = await prisma.groupMinistryBibleStudy.findUnique({ where: { groupId } });
  if (!record) return null;
  return {
    groupId: record.groupId,
    leaderUserId: record.leaderUserId ?? undefined,
    leaderName: record.leaderName,
    topic: record.topic,
    bibleBook: record.bibleBook,
    meetingWeekday: record.meetingWeekday,
    meetingTime: record.meetingTime ?? undefined,
    reminder1Hour: record.reminder1Hour,
    reminder1Minute: record.reminder1Minute,
    reminder2Hour: record.reminder2Hour,
    reminder2Minute: record.reminder2Minute,
    lastReminder1DateKey: record.lastReminder1DateKey ?? undefined,
    lastReminder2DateKey: record.lastReminder2DateKey ?? undefined,
    updatedAt: record.updatedAt.toISOString(),
  } satisfies MinistryHubBibleStudy;
}

export async function saveGroupBibleStudy(
  study: Omit<MinistryHubBibleStudy, "updatedAt"> & { updatedAt?: string },
) {
  const record = await prisma.groupMinistryBibleStudy.upsert({
    where: { groupId: study.groupId },
    create: {
      groupId: study.groupId,
      leaderUserId: study.leaderUserId ?? null,
      leaderName: study.leaderName,
      topic: study.topic,
      bibleBook: study.bibleBook,
      meetingWeekday: study.meetingWeekday,
      meetingTime: study.meetingTime ?? null,
      reminder1Hour: study.reminder1Hour,
      reminder1Minute: study.reminder1Minute,
      reminder2Hour: study.reminder2Hour,
      reminder2Minute: study.reminder2Minute,
      lastReminder1DateKey: study.lastReminder1DateKey ?? null,
      lastReminder2DateKey: study.lastReminder2DateKey ?? null,
    },
    update: {
      leaderUserId: study.leaderUserId ?? null,
      leaderName: study.leaderName,
      topic: study.topic,
      bibleBook: study.bibleBook,
      meetingWeekday: study.meetingWeekday,
      meetingTime: study.meetingTime ?? null,
      reminder1Hour: study.reminder1Hour,
      reminder1Minute: study.reminder1Minute,
      reminder2Hour: study.reminder2Hour,
      reminder2Minute: study.reminder2Minute,
      lastReminder1DateKey: study.lastReminder1DateKey ?? null,
      lastReminder2DateKey: study.lastReminder2DateKey ?? null,
    },
  });
  return {
    groupId: record.groupId,
    leaderUserId: record.leaderUserId ?? undefined,
    leaderName: record.leaderName,
    topic: record.topic,
    bibleBook: record.bibleBook,
    meetingWeekday: record.meetingWeekday,
    meetingTime: record.meetingTime ?? undefined,
    reminder1Hour: record.reminder1Hour,
    reminder1Minute: record.reminder1Minute,
    reminder2Hour: record.reminder2Hour,
    reminder2Minute: record.reminder2Minute,
    lastReminder1DateKey: record.lastReminder1DateKey ?? undefined,
    lastReminder2DateKey: record.lastReminder2DateKey ?? undefined,
    updatedAt: record.updatedAt.toISOString(),
  } satisfies MinistryHubBibleStudy;
}

export async function markBibleStudyReminderSent(groupId: string, slot: 1 | 2, dateKey: string) {
  const data =
    slot === 1
      ? { lastReminder1DateKey: dateKey }
      : { lastReminder2DateKey: dateKey };
  const record = await prisma.groupMinistryBibleStudy.update({
    where: { groupId },
    data,
  });
  return getGroupBibleStudy(record.groupId);
}

export async function getActiveBiblePlan(groupId: string) {
  const record = await prisma.groupMinistryBiblePlan.findFirst({
    where: { groupId, active: true },
    orderBy: { createdAt: "desc" },
  });
  if (!record) return null;
  return {
    id: record.id,
    groupId: record.groupId,
    title: record.title,
    days: parseDays(record.daysJson),
    active: record.active,
    createdAt: record.createdAt.toISOString(),
  } satisfies MinistryHubBiblePlan;
}

export async function saveBiblePlan(input: {
  groupId: string;
  title: string;
  days: MinistryHubBiblePlanDay[];
}) {
  await prisma.groupMinistryBiblePlan.updateMany({
    where: { groupId: input.groupId, active: true },
    data: { active: false },
  });
  const record = await prisma.groupMinistryBiblePlan.create({
    data: {
      id: `ybplan-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      groupId: input.groupId,
      title: input.title.trim(),
      daysJson: JSON.stringify(input.days),
      active: true,
    },
  });
  return {
    id: record.id,
    groupId: record.groupId,
    title: record.title,
    days: parseDays(record.daysJson),
    active: record.active,
    createdAt: record.createdAt.toISOString(),
  } satisfies MinistryHubBiblePlan;
}

export async function getBiblePlanProgress(planId: string, userId: string) {
  const record = await prisma.groupMinistryBiblePlanProgress.findUnique({
    where: { planId_userId: { planId, userId } },
  });
  return record ? parseCompleted(record.completedJson) : [];
}

export async function setBiblePlanDayComplete(
  planId: string,
  userId: string,
  dayIndex: number,
  completed: boolean,
) {
  const existing = await prisma.groupMinistryBiblePlanProgress.findUnique({
    where: { planId_userId: { planId, userId } },
  });
  const current = new Set(existing ? parseCompleted(existing.completedJson) : []);
  if (completed) current.add(dayIndex);
  else current.delete(dayIndex);
  const completedJson = JSON.stringify([...current].sort((a, b) => a - b));
  await prisma.groupMinistryBiblePlanProgress.upsert({
    where: { planId_userId: { planId, userId } },
    create: { planId, userId, completedJson },
    update: { completedJson },
  });
  return parseCompleted(completedJson);
}

export async function getActiveFaithChallenge(groupId: string) {
  const record = await prisma.groupMinistryFaithChallenge.findFirst({
    where: { groupId, active: true },
    orderBy: { createdAt: "desc" },
  });
  if (!record) return null;
  return {
    id: record.id,
    groupId: record.groupId,
    title: record.title,
    body: record.body,
    weekStart: record.weekStart,
    active: record.active,
    createdAt: record.createdAt.toISOString(),
  } satisfies MinistryHubFaithChallenge;
}

export async function saveFaithChallenge(input: {
  groupId: string;
  title: string;
  body: string;
  weekStart: string;
}) {
  await prisma.groupMinistryFaithChallenge.updateMany({
    where: { groupId: input.groupId, active: true },
    data: { active: false },
  });
  const record = await prisma.groupMinistryFaithChallenge.create({
    data: {
      id: `yfchallenge-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      groupId: input.groupId,
      title: input.title.trim(),
      body: input.body.trim(),
      weekStart: input.weekStart,
      active: true,
    },
  });
  return {
    id: record.id,
    groupId: record.groupId,
    title: record.title,
    body: record.body,
    weekStart: record.weekStart,
    active: record.active,
    createdAt: record.createdAt.toISOString(),
  } satisfies MinistryHubFaithChallenge;
}

export async function hasFaithChallengeCheckIn(challengeId: string, userId: string) {
  const record = await prisma.groupMinistryFaithChallengeCheckIn.findUnique({
    where: { challengeId_userId: { challengeId, userId } },
  });
  return Boolean(record);
}

export async function addFaithChallengeCheckIn(challengeId: string, userId: string) {
  await prisma.groupMinistryFaithChallengeCheckIn.upsert({
    where: { challengeId_userId: { challengeId, userId } },
    create: {
      id: `yfcheck-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      challengeId,
      userId,
    },
    update: {},
  });
  return true;
}

export async function countFaithChallengeCheckIns(challengeId: string) {
  return prisma.groupMinistryFaithChallengeCheckIn.count({
    where: { challengeId },
  });
}

export async function listHubBibleStudies() {
  const records = await prisma.groupMinistryBibleStudy.findMany();
  return records.map((record) => ({
    groupId: record.groupId,
    leaderUserId: record.leaderUserId ?? undefined,
    leaderName: record.leaderName,
    topic: record.topic,
    bibleBook: record.bibleBook,
    meetingWeekday: record.meetingWeekday,
    meetingTime: record.meetingTime ?? undefined,
    reminder1Hour: record.reminder1Hour,
    reminder1Minute: record.reminder1Minute,
    reminder2Hour: record.reminder2Hour,
    reminder2Minute: record.reminder2Minute,
    lastReminder1DateKey: record.lastReminder1DateKey ?? undefined,
    lastReminder2DateKey: record.lastReminder2DateKey ?? undefined,
    updatedAt: record.updatedAt.toISOString(),
  }));
}
