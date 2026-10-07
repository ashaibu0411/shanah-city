import { promises as fs } from "fs";
import path from "path";
import type {
  MinistryHubBiblePlan,
  MinistryHubBiblePlanDay,
  MinistryHubBibleStudy,
  MinistryHubFaithChallenge,
} from "@/lib/group-ministry-hub-types";

const DATA_DIR = path.join(process.cwd(), "data");
const FILE = path.join(DATA_DIR, "group-ministry-hub-program.json");

type ProgramFile = {
  bibleStudies: Record<string, MinistryHubBibleStudy>;
  biblePlans: MinistryHubBiblePlan[];
  planProgress: Record<string, Record<string, number[]>>;
  faithChallenges: MinistryHubFaithChallenge[];
  challengeCheckIns: Record<string, string[]>;
};

async function readProgram(): Promise<ProgramFile> {
  try {
    const raw = await fs.readFile(FILE, "utf-8");
    const data = JSON.parse(raw) as ProgramFile;
    return {
      bibleStudies: data.bibleStudies ?? {},
      biblePlans: Array.isArray(data.biblePlans) ? data.biblePlans : [],
      planProgress: data.planProgress ?? {},
      faithChallenges: Array.isArray(data.faithChallenges) ? data.faithChallenges : [],
      challengeCheckIns: data.challengeCheckIns ?? {},
    };
  } catch {
    return {
      bibleStudies: {},
      biblePlans: [],
      planProgress: {},
      faithChallenges: [],
      challengeCheckIns: {},
    };
  }
}

async function writeProgram(data: ProgramFile) {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(FILE, JSON.stringify(data, null, 2));
}

export async function getGroupBibleStudy(groupId: string) {
  const program = await readProgram();
  return program.bibleStudies[groupId] ?? null;
}

export async function saveGroupBibleStudy(
  study: Omit<MinistryHubBibleStudy, "updatedAt"> & { updatedAt?: string },
) {
  const program = await readProgram();
  const record: MinistryHubBibleStudy = {
    ...study,
    updatedAt: study.updatedAt ?? new Date().toISOString(),
  };
  program.bibleStudies[study.groupId] = record;
  await writeProgram(program);
  return record;
}

export async function markBibleStudyReminderSent(
  groupId: string,
  slot: 1 | 2,
  dateKey: string,
) {
  const program = await readProgram();
  const existing = program.bibleStudies[groupId];
  if (!existing) return null;
  const updated: MinistryHubBibleStudy = {
    ...existing,
    updatedAt: new Date().toISOString(),
    ...(slot === 1 ? { lastReminder1DateKey: dateKey } : { lastReminder2DateKey: dateKey }),
  };
  program.bibleStudies[groupId] = updated;
  await writeProgram(program);
  return updated;
}

export async function getActiveBiblePlan(groupId: string) {
  const program = await readProgram();
  return (
    program.biblePlans
      .filter((plan) => plan.groupId === groupId && plan.active)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0] ?? null
  );
}

export async function saveBiblePlan(input: {
  groupId: string;
  title: string;
  days: MinistryHubBiblePlanDay[];
}) {
  const program = await readProgram();
  for (const plan of program.biblePlans) {
    if (plan.groupId === input.groupId) plan.active = false;
  }
  const record: MinistryHubBiblePlan = {
    id: `ybplan-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    groupId: input.groupId,
    title: input.title.trim(),
    days: input.days,
    active: true,
    createdAt: new Date().toISOString(),
  };
  program.biblePlans.push(record);
  await writeProgram(program);
  return record;
}

export async function getBiblePlanProgress(planId: string, userId: string) {
  const program = await readProgram();
  return program.planProgress[planId]?.[userId] ?? [];
}

export async function setBiblePlanDayComplete(
  planId: string,
  userId: string,
  dayIndex: number,
  completed: boolean,
) {
  const program = await readProgram();
  const current = new Set(program.planProgress[planId]?.[userId] ?? []);
  if (completed) current.add(dayIndex);
  else current.delete(dayIndex);
  program.planProgress[planId] = program.planProgress[planId] ?? {};
  program.planProgress[planId][userId] = [...current].sort((a, b) => a - b);
  await writeProgram(program);
  return program.planProgress[planId][userId];
}

export async function getActiveFaithChallenge(groupId: string) {
  const program = await readProgram();
  return (
    program.faithChallenges
      .filter((entry) => entry.groupId === groupId && entry.active)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0] ?? null
  );
}

export async function saveFaithChallenge(input: {
  groupId: string;
  title: string;
  body: string;
  weekStart: string;
}) {
  const program = await readProgram();
  for (const challenge of program.faithChallenges) {
    if (challenge.groupId === input.groupId) challenge.active = false;
  }
  const record: MinistryHubFaithChallenge = {
    id: `yfchallenge-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    groupId: input.groupId,
    title: input.title.trim(),
    body: input.body.trim(),
    weekStart: input.weekStart,
    active: true,
    createdAt: new Date().toISOString(),
  };
  program.faithChallenges.push(record);
  await writeProgram(program);
  return record;
}

export async function hasFaithChallengeCheckIn(challengeId: string, userId: string) {
  const program = await readProgram();
  return (program.challengeCheckIns[challengeId] ?? []).includes(userId);
}

export async function addFaithChallengeCheckIn(challengeId: string, userId: string) {
  const program = await readProgram();
  const list = program.challengeCheckIns[challengeId] ?? [];
  if (!list.includes(userId)) list.push(userId);
  program.challengeCheckIns[challengeId] = list;
  await writeProgram(program);
  return true;
}

export async function countFaithChallengeCheckIns(challengeId: string) {
  const program = await readProgram();
  return (program.challengeCheckIns[challengeId] ?? []).length;
}

export async function listHubBibleStudies() {
  const program = await readProgram();
  return Object.values(program.bibleStudies);
}
