import { prisma } from "@/lib/db";
import type { CoupleCheckInAnswerRecord, CoupleCheckInWeekRecord, CheckInDimensionId } from "@/lib/couple-check-in-types";

function mapWeek(row: { id: string; coupleLinkId: string; weekStart: string; createdAt: Date }) {
  return {
    id: row.id,
    coupleLinkId: row.coupleLinkId,
    weekStart: row.weekStart,
    createdAt: row.createdAt.toISOString(),
  } satisfies CoupleCheckInWeekRecord;
}

function mapAnswer(row: {
  id: string;
  weekId: string;
  userId: string;
  dimension: string;
  reflection: string | null;
  rating: number | null;
  shareWithSpouse: boolean;
  createdAt: Date;
}) {
  return {
    id: row.id,
    weekId: row.weekId,
    userId: row.userId,
    dimension: row.dimension as CheckInDimensionId,
    reflection: row.reflection ?? undefined,
    rating: row.rating ?? undefined,
    shareWithSpouse: row.shareWithSpouse,
    createdAt: row.createdAt.toISOString(),
  } satisfies CoupleCheckInAnswerRecord;
}

export async function getOrCreateCheckInWeek(coupleLinkId: string, weekStart: string) {
  const existing = await prisma.coupleCheckInWeek.findUnique({
    where: { coupleLinkId_weekStart: { coupleLinkId, weekStart } },
  });
  if (existing) return mapWeek(existing);

  const created = await prisma.coupleCheckInWeek.create({
    data: {
      id: `cweek-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      coupleLinkId,
      weekStart,
    },
  });
  return mapWeek(created);
}

export async function listCheckInAnswers(weekId: string) {
  const rows = await prisma.coupleCheckInAnswer.findMany({ where: { weekId } });
  return rows.map(mapAnswer);
}

export async function upsertCheckInAnswer(input: {
  weekId: string;
  userId: string;
  dimension: CheckInDimensionId;
  reflection?: string;
  rating?: number | null;
  shareWithSpouse: boolean;
}) {
  const existing = await prisma.coupleCheckInAnswer.findUnique({
    where: {
      weekId_userId_dimension: {
        weekId: input.weekId,
        userId: input.userId,
        dimension: input.dimension,
      },
    },
  });

  if (existing) {
    const row = await prisma.coupleCheckInAnswer.update({
      where: { id: existing.id },
      data: {
        reflection: input.reflection?.trim() || null,
        rating: input.rating === undefined ? existing.rating : input.rating,
        shareWithSpouse: input.shareWithSpouse,
      },
    });
    return mapAnswer(row);
  }

  const row = await prisma.coupleCheckInAnswer.create({
    data: {
      id: `cans-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      weekId: input.weekId,
      userId: input.userId,
      dimension: input.dimension,
      reflection: input.reflection?.trim() || null,
      rating: input.rating ?? null,
      shareWithSpouse: input.shareWithSpouse,
    },
  });
  return mapAnswer(row);
}
