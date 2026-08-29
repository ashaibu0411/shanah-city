import { prisma } from "@/lib/db";
import {
  estimateReadingTime,
  formatDisplayDateFromInput,
  isDevotionPubliclyVisible,
  pickTodayDevotion,
  sortDevotionsForDisplay,
  toDateInputValue,
} from "@/lib/devotion-utils";
import type { Devotion } from "@/lib/types";

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
  audioUrl: string | null;
  audioName: string | null;
  artworkSquareUrl: string | null;
  artworkWideUrl: string | null;
  artworkBannerUrl: string | null;
  createdAt: Date | null;
  updatedAt: Date | null;
  publishAt: Date | null;
  notifiedAt: Date | null;
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
    audioUrl: record.audioUrl ?? undefined,
    audioName: record.audioName ?? undefined,
    artworkSquareUrl: record.artworkSquareUrl ?? undefined,
    artworkWideUrl: record.artworkWideUrl ?? undefined,
    artworkBannerUrl: record.artworkBannerUrl ?? undefined,
    createdAt: record.createdAt?.toISOString(),
    updatedAt: record.updatedAt?.toISOString(),
    publishAt: record.publishAt?.toISOString(),
    notifiedAt: record.notifiedAt?.toISOString(),
  };
}

export async function getDevotions(options?: { includeUnpublished?: boolean }) {
  const records = await prisma.devotion.findMany({
    where: options?.includeUnpublished ? undefined : { published: true },
  });

  const mapped = records.map(mapDevotion).sort(sortDevotionsForDisplay);

  if (options?.includeUnpublished) {
    return mapped;
  }

  return mapped.filter((devotion) => isDevotionPubliclyVisible(devotion));
}

export async function getTodayDevotion() {
  const devotions = await getDevotions();
  return pickTodayDevotion(devotions);
}

export async function getDevotionById(id: string) {
  const record = await prisma.devotion.findUnique({ where: { id } });
  return record ? mapDevotion(record) : null;
}

export async function createDevotion(
  input: Omit<Devotion, "id" | "createdAt" | "updatedAt" | "date" | "readingTime"> & {
    date?: string;
    readingTime?: string;
    publishAt?: string | null;
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
      date:
        input.date ||
        formatDisplayDateFromInput(toDateInputValue(now)),
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
      audioUrl: input.audioUrl ?? null,
      audioName: input.audioName ?? null,
      artworkSquareUrl: input.artworkSquareUrl ?? null,
      artworkWideUrl: input.artworkWideUrl ?? null,
      artworkBannerUrl: input.artworkBannerUrl ?? null,
      publishAt: input.publishAt ? new Date(input.publishAt) : null,
      createdAt: now,
      updatedAt: now,
    },
  });

  return mapDevotion(record);
}

export async function updateDevotion(
  id: string,
  update: Partial<Omit<Devotion, "id" | "createdAt" | "audioUrl" | "audioName" | "artworkSquareUrl" | "artworkWideUrl" | "artworkBannerUrl">> & {
    audioUrl?: string | null;
    audioName?: string | null;
    artworkSquareUrl?: string | null;
    artworkWideUrl?: string | null;
    artworkBannerUrl?: string | null;
  },
) {
  const existing = await prisma.devotion.findUnique({ where: { id } });
  if (!existing) return null;

  const merged = {
    ...mapDevotion(existing),
    ...update,
  };

  const record = await prisma.devotion.update({
    where: { id },
    data: {
      title: update.title,
      verse: update.verse,
      reference: update.reference,
      content: update.content,
      prayer: update.prayer,
      date: update.date,
      readingTime:
        update.readingTime ??
        estimateReadingTime({
          verse: merged.verse,
          content: merged.content,
          prayer: merged.prayer,
        }),
      published: update.published,
      authorId: update.authorId,
      authorName: update.authorName,
      audioUrl: update.audioUrl === null ? null : update.audioUrl,
      audioName: update.audioName === null ? null : update.audioName,
      artworkSquareUrl:
        update.artworkSquareUrl === null ? null : update.artworkSquareUrl,
      artworkWideUrl: update.artworkWideUrl === null ? null : update.artworkWideUrl,
      artworkBannerUrl:
        update.artworkBannerUrl === null ? null : update.artworkBannerUrl,
      publishAt:
        update.publishAt === null
          ? null
          : update.publishAt
            ? new Date(update.publishAt)
            : undefined,
      notifiedAt:
        update.notifiedAt === null
          ? null
          : update.publishAt && new Date(update.publishAt) > new Date()
            ? null
            : undefined,
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

export async function getDevotionsDueForNotification(now = new Date()) {
  const records = await prisma.devotion.findMany({
    where: {
      published: true,
      notifiedAt: null,
      publishAt: { not: null, lte: now },
    },
  });

  return records.map(mapDevotion);
}

export async function markDevotionNotified(id: string) {
  await prisma.devotion.update({
    where: { id },
    data: { notifiedAt: new Date() },
  });
}

export async function clearDevotionNotified(id: string) {
  await prisma.devotion.update({
    where: { id },
    data: { notifiedAt: null },
  });
}
