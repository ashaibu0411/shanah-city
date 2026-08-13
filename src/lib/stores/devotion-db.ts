import { prisma } from "@/lib/db";
import type { Devotion } from "@/lib/types";

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

function mapDevotion(record: {
  id: string;
  title: string;
  verse: string;
  reference: string;
  readingTime: string;
  content: string;
  prayer: string;
  date: string;
  published: boolean;
  authorId: string | null;
  authorName: string | null;
  createdAt: Date | null;
  updatedAt: Date | null;
}): Devotion {
  return {
    id: record.id,
    title: record.title,
    verse: record.verse,
    reference: record.reference,
    readingTime: record.readingTime,
    content: record.content,
    prayer: record.prayer,
    date: record.date,
    published: record.published,
    authorId: record.authorId ?? undefined,
    authorName: record.authorName ?? undefined,
    createdAt: record.createdAt?.toISOString(),
    updatedAt: record.updatedAt?.toISOString(),
  };
}

export async function getDevotions(options?: { includeUnpublished?: boolean }) {
  const records = await prisma.devotion.findMany({
    where: options?.includeUnpublished ? undefined : { published: true },
  });

  return records
    .map(mapDevotion)
    .sort((a, b) => {
      const aTime = new Date(a.updatedAt ?? a.createdAt ?? a.date).getTime();
      const bTime = new Date(b.updatedAt ?? b.createdAt ?? b.date).getTime();
      return bTime - aTime;
    });
}

export async function getTodayDevotion() {
  const devotions = await getDevotions();
  return devotions[0] ?? null;
}

export async function getDevotionById(id: string) {
  const record = await prisma.devotion.findUnique({ where: { id } });
  return record ? mapDevotion(record) : null;
}

export async function createDevotion(
  input: Omit<Devotion, "id" | "createdAt" | "updatedAt" | "date" | "readingTime"> & {
    date?: string;
    readingTime?: string;
  },
  author: { id: string; name: string },
) {
  const now = new Date();
  const record = await prisma.devotion.create({
    data: {
      id: `dev-${Date.now()}`,
      title: input.title,
      verse: input.verse,
      reference: input.reference,
      content: input.content,
      prayer: input.prayer,
      date: input.date || formatDisplayDate(now.toISOString()),
      readingTime: input.readingTime || estimateReadingTime(input.content),
      authorId: author.id,
      authorName: author.name,
      published: input.published ?? true,
      createdAt: now,
      updatedAt: now,
    },
  });

  return mapDevotion(record);
}

export async function updateDevotion(
  id: string,
  update: Partial<Omit<Devotion, "id" | "createdAt">>,
) {
  const existing = await prisma.devotion.findUnique({ where: { id } });
  if (!existing) return null;

  const readingTime =
    update.content && !update.readingTime
      ? estimateReadingTime(update.content)
      : update.readingTime ?? existing.readingTime;

  const record = await prisma.devotion.update({
    where: { id },
    data: {
      title: update.title,
      verse: update.verse,
      reference: update.reference,
      content: update.content,
      prayer: update.prayer,
      date: update.date,
      readingTime,
      published: update.published,
      authorId: update.authorId,
      authorName: update.authorName,
      updatedAt: new Date(),
    },
  });

  return mapDevotion(record);
}

export async function deleteDevotion(id: string) {
  try {
    await prisma.devotion.delete({ where: { id } });
    return true;
  } catch {
    return false;
  }
}
