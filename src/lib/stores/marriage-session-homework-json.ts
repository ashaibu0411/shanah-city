import { promises as fs } from "fs";
import path from "path";
import type {
  MarriageSessionHomeworkRecord,
  MarriageSessionHomeworkResponseRecord,
} from "@/lib/marriage-homework-types";

const DATA_DIR = path.join(process.cwd(), "data");
const FILE =
  process.env.MARRIAGE_SESSION_HOMEWORK_DATA_FILE?.trim() ||
  path.join(DATA_DIR, "marriage-session-homework.json");

type HomeworkStoreFile = {
  homework: MarriageSessionHomeworkRecord[];
  responses: MarriageSessionHomeworkResponseRecord[];
};

async function readStore(): Promise<HomeworkStoreFile> {
  try {
    const raw = await fs.readFile(FILE, "utf-8");
    const parsed = JSON.parse(raw) as HomeworkStoreFile;
    if (!parsed.homework) parsed.homework = [];
    if (!parsed.responses) parsed.responses = [];
    return parsed;
  } catch {
    return { homework: [], responses: [] };
  }
}

async function writeStore(data: HomeworkStoreFile) {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(FILE, JSON.stringify(data, null, 2));
}

function mapHomework(record: MarriageSessionHomeworkRecord): MarriageSessionHomeworkRecord {
  return {
    ...record,
    activities: record.activities ?? [],
    partnerFeedback: record.partnerFeedback ?? undefined,
  };
}

export async function listSessionHomeworkForJourney(journeyId: string) {
  const store = await readStore();
  return store.homework
    .filter((h) => h.journeyId === journeyId)
    .map(mapHomework)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function getSessionHomeworkById(id: string) {
  const store = await readStore();
  const row = store.homework.find((h) => h.id === id);
  return row ? mapHomework(row) : null;
}

export async function findDraftSessionHomeworkByTemplate(journeyId: string, templateKey: string) {
  const store = await readStore();
  const row = store.homework.find(
    (h) => h.journeyId === journeyId && h.templateKey === templateKey && h.status === "draft",
  );
  return row ? mapHomework(row) : null;
}

export async function saveSessionHomework(record: MarriageSessionHomeworkRecord) {
  const store = await readStore();
  const idx = store.homework.findIndex((h) => h.id === record.id);
  const normalized = mapHomework(record);
  if (idx >= 0) store.homework[idx] = normalized;
  else store.homework.push(normalized);
  await writeStore(store);
  return normalized;
}

export async function listSessionHomeworkResponses(homeworkId: string) {
  const store = await readStore();
  return store.responses.filter((r) => r.homeworkId === homeworkId);
}

export async function getSessionHomeworkResponse(homeworkId: string, userId: string) {
  const store = await readStore();
  return store.responses.find((r) => r.homeworkId === homeworkId && r.userId === userId) ?? null;
}

export async function saveSessionHomeworkResponse(record: MarriageSessionHomeworkResponseRecord) {
  const store = await readStore();
  const idx = store.responses.findIndex(
    (r) => r.homeworkId === record.homeworkId && r.userId === record.userId,
  );
  if (idx >= 0) store.responses[idx] = record;
  else store.responses.push(record);
  await writeStore(store);
  return record;
}
