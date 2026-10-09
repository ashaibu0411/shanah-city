import { promises as fs } from "fs";
import path from "path";
import type { CoupleCheckInAnswerRecord, CoupleCheckInWeekRecord, CheckInDimensionId } from "@/lib/couple-check-in-types";

const DATA_DIR = path.join(process.cwd(), "data");
const WEEKS_FILE = path.join(DATA_DIR, "couple-check-in-weeks.json");
const ANSWERS_FILE = path.join(DATA_DIR, "couple-check-in-answers.json");

async function readWeeks() {
  try {
    return JSON.parse(await fs.readFile(WEEKS_FILE, "utf-8")) as CoupleCheckInWeekRecord[];
  } catch {
    return [];
  }
}

async function writeWeeks(weeks: CoupleCheckInWeekRecord[]) {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(WEEKS_FILE, JSON.stringify(weeks, null, 2));
}

async function readAnswers() {
  try {
    return JSON.parse(await fs.readFile(ANSWERS_FILE, "utf-8")) as CoupleCheckInAnswerRecord[];
  } catch {
    return [];
  }
}

async function writeAnswers(answers: CoupleCheckInAnswerRecord[]) {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(ANSWERS_FILE, JSON.stringify(answers, null, 2));
}

export async function getOrCreateCheckInWeek(coupleLinkId: string, weekStart: string) {
  const weeks = await readWeeks();
  const found = weeks.find((w) => w.coupleLinkId === coupleLinkId && w.weekStart === weekStart);
  if (found) return found;
  const record: CoupleCheckInWeekRecord = {
    id: `cweek-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    coupleLinkId,
    weekStart,
    createdAt: new Date().toISOString(),
  };
  weeks.push(record);
  await writeWeeks(weeks);
  return record;
}

export async function listCheckInAnswers(weekId: string) {
  const answers = await readAnswers();
  return answers.filter((a) => a.weekId === weekId);
}

export async function upsertCheckInAnswer(input: {
  weekId: string;
  userId: string;
  dimension: CheckInDimensionId;
  reflection?: string;
  shareWithSpouse: boolean;
}) {
  const answers = await readAnswers();
  const index = answers.findIndex(
    (a) => a.weekId === input.weekId && a.userId === input.userId && a.dimension === input.dimension,
  );
  const record: CoupleCheckInAnswerRecord = {
    id: index >= 0 ? answers[index].id : `cans-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    weekId: input.weekId,
    userId: input.userId,
    dimension: input.dimension,
    reflection: input.reflection?.trim() || undefined,
    shareWithSpouse: input.shareWithSpouse,
    createdAt: index >= 0 ? answers[index].createdAt : new Date().toISOString(),
  };
  if (index >= 0) answers[index] = record;
  else answers.push(record);
  await writeAnswers(answers);
  return record;
}
