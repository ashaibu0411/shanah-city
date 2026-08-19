import { promises as fs } from "fs";
import path from "path";
import type { KidsLesson } from "@/lib/kids-types";

const DATA_DIR = path.join(process.cwd(), "data");
const FILE = "kids-lessons.json";

async function readLessons() {
  try {
    const raw = await fs.readFile(path.join(DATA_DIR, FILE), "utf-8");
    return JSON.parse(raw) as KidsLesson[];
  } catch {
    return [];
  }
}

async function writeLessons(lessons: KidsLesson[]) {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(path.join(DATA_DIR, FILE), JSON.stringify(lessons, null, 2));
}

export async function listKidsLessons(options?: { weekStarting?: string; status?: KidsLesson["status"] }) {
  let lessons = await readLessons();
  if (options?.weekStarting) {
    lessons = lessons.filter((lesson) => lesson.weekStarting === options.weekStarting);
  }
  if (options?.status) {
    lessons = lessons.filter((lesson) => lesson.status === options.status);
  }
  return lessons.sort((a, b) => a.ageGroup.localeCompare(b.ageGroup));
}

export async function getKidsLesson(weekStarting: string, ageGroup: string) {
  const lessons = await readLessons();
  return lessons.find(
    (lesson) => lesson.weekStarting === weekStarting && lesson.ageGroup === ageGroup,
  ) ?? null;
}

export async function saveKidsLesson(input: Omit<KidsLesson, "updatedAt">) {
  const lessons = await readLessons();
  const now = new Date().toISOString();
  const index = lessons.findIndex(
    (lesson) => lesson.weekStarting === input.weekStarting && lesson.ageGroup === input.ageGroup,
  );
  const record: KidsLesson = {
    ...input,
    createdAt: input.createdAt ?? (index === -1 ? now : lessons[index].createdAt),
    updatedAt: now,
  };
  if (index === -1) {
    lessons.push(record);
  } else {
    lessons[index] = record;
  }
  await writeLessons(lessons);
  return record;
}
