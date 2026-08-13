import { promises as fs } from "fs";
import path from "path";
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

function formatDisplayDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function estimateReadingTime(content: string) {
  const words = content.trim().split(/\s+/).length;
  const minutes = Math.max(1, Math.round(words / 180));
  return `${minutes} min`;
}

export async function getDevotions(options?: { includeUnpublished?: boolean }) {
  const devotions = await readJson<Devotion[]>(DEVOTIONS_FILE, []);
  const sorted = [...devotions].sort((a, b) => {
    const aTime = new Date(a.updatedAt ?? a.createdAt ?? a.date).getTime();
    const bTime = new Date(b.updatedAt ?? b.createdAt ?? b.date).getTime();
    return bTime - aTime;
  });

  if (options?.includeUnpublished) {
    return sorted;
  }

  return sorted.filter((devotion) => devotion.published !== false);
}

export async function getTodayDevotion() {
  const devotions = await getDevotions();
  return devotions[0] ?? null;
}

export async function getDevotionById(id: string) {
  const devotions = await getDevotions({ includeUnpublished: true });
  return devotions.find((devotion) => devotion.id === id) ?? null;
}

export async function createDevotion(
  input: Omit<Devotion, "id" | "createdAt" | "updatedAt" | "date" | "readingTime"> & {
    date?: string;
    readingTime?: string;
  },
  author: { id: string; name: string },
) {
  const now = new Date().toISOString();
  const devotion: Devotion = {
    ...input,
    id: `dev-${Date.now()}`,
    date: input.date || formatDisplayDate(now),
    readingTime: input.readingTime || estimateReadingTime(input.content),
    authorId: author.id,
    authorName: author.name,
    published: input.published ?? true,
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

  devotions[index] = {
    ...devotions[index],
    ...update,
    readingTime:
      update.content && !update.readingTime
        ? estimateReadingTime(update.content)
        : update.readingTime ?? devotions[index].readingTime,
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
