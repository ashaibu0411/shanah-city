import { promises as fs } from "fs";
import path from "path";
import {
  estimateReadingTime,
  formatDisplayDateFromInput,
  isDevotionPubliclyVisible,
  pickTodayDevotion,
  sortDevotionsForDisplay,
  defaultScheduleDateInput,
} from "@/lib/devotion-utils";
import type { Devotion } from "@/lib/types";

const DATA_DIR = path.join(process.cwd(), "data");
const DEVOTIONS_FILE = path.join(DATA_DIR, "devotions.json");

async function readJson<T>(file: string, fallback: T): Promise<T> {
  try {
    const raw = await fs.readFile(file, "utf-8");
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

async function writeJson<T>(file: string, data: T) {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(file, JSON.stringify(data, null, 2));
}

export async function getDevotions(options?: { includeUnpublished?: boolean }) {
  const devotions = await readJson<Devotion[]>(DEVOTIONS_FILE, []);
  const sorted = [...devotions].sort(sortDevotionsForDisplay);

  if (options?.includeUnpublished) {
    return sorted;
  }

  return sorted.filter((devotion) => isDevotionPubliclyVisible(devotion));
}

export async function getTodayDevotion() {
  const devotions = await getDevotions();
  return pickTodayDevotion(devotions);
}

export async function getDevotionById(id: string) {
  const devotions = await getDevotions({ includeUnpublished: true });
  return devotions.find((devotion) => devotion.id === id) ?? null;
}

export async function createDevotion(
  input: Omit<Devotion, "id" | "createdAt" | "updatedAt" | "date" | "readingTime"> & {
    date?: string;
    readingTime?: string;
    publishAt?: string | null;
  },
  author: { id: string; name: string },
) {
  const now = new Date().toISOString();
  const devotion: Devotion = {
    ...input,
    id: `dev-${Date.now()}`,
    date: input.date || formatDisplayDateFromInput(defaultScheduleDateInput()),
    readingTime:
      input.readingTime ||
      estimateReadingTime({
        verse: input.verse,
        content: input.content,
        prayer: input.prayer,
      }),
    authorId: author.id,
    authorName: author.name,
    published: input.published ?? true,
    publishAt: input.publishAt ?? undefined,
    createdAt: now,
    updatedAt: now,
  };

  const devotions = await getDevotions({ includeUnpublished: true });
  devotions.unshift(devotion);
  await writeJson(DEVOTIONS_FILE, devotions);
  return devotion;
}

export async function updateDevotion(
  id: string,
  update: Partial<Omit<Devotion, "id" | "createdAt">>,
) {
  const devotions = await getDevotions({ includeUnpublished: true });
  const index = devotions.findIndex((devotion) => devotion.id === id);
  if (index === -1) return null;

  const merged = {
    ...devotions[index],
    ...update,
  };

  devotions[index] = {
    ...merged,
    readingTime:
      update.readingTime ??
      estimateReadingTime({
        verse: merged.verse,
        content: merged.content,
        prayer: merged.prayer,
      }),
    publishAt:
      update.publishAt === null
        ? undefined
        : update.publishAt ?? devotions[index].publishAt,
    notifiedAt:
      update.publishAt && new Date(update.publishAt) > new Date()
        ? undefined
        : update.notifiedAt ?? devotions[index].notifiedAt,
    updatedAt: new Date().toISOString(),
  };

  await writeJson(DEVOTIONS_FILE, devotions);
  return devotions[index];
}

export async function deleteDevotion(id: string) {
  const devotions = await getDevotions({ includeUnpublished: true });
  const next = devotions.filter((devotion) => devotion.id !== id);
  if (next.length === devotions.length) return false;
  await writeJson(DEVOTIONS_FILE, next);
  return true;
}

export async function getDevotionsDueForNotification(now = new Date()) {
  const devotions = await getDevotions({ includeUnpublished: true });
  return devotions.filter(
    (devotion) =>
      devotion.published !== false &&
      !devotion.notifiedAt &&
      devotion.publishAt &&
      new Date(devotion.publishAt) <= now,
  );
}

export async function markDevotionNotified(id: string) {
  return updateDevotion(id, { notifiedAt: new Date().toISOString() });
}
