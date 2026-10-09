import { prisma } from "@/lib/db";
import type { CoupleMarriageDevotionalRecord } from "@/lib/couple-marriage-devotional-types";

function mapDevotional(row: {
  id: string;
  publishDate: string;
  title: string;
  scripture: string;
  teaching: string;
  discussion: string;
  assignment: string;
  prayer: string;
  declaration: string;
  published: boolean;
  createdBy: string;
  createdByName: string;
  createdAt: Date;
  updatedAt: Date;
}): CoupleMarriageDevotionalRecord {
  return {
    id: row.id,
    publishDate: row.publishDate,
    title: row.title,
    scripture: row.scripture,
    teaching: row.teaching,
    discussion: row.discussion,
    assignment: row.assignment,
    prayer: row.prayer,
    declaration: row.declaration,
    published: row.published,
    createdBy: row.createdBy,
    createdByName: row.createdByName,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export async function listMarriageDevotionals(options: { publishedOnly?: boolean }) {
  const rows = await prisma.coupleMarriageDevotional.findMany({
    where: options.publishedOnly ? { published: true } : undefined,
    orderBy: { publishDate: "desc" },
  });
  return rows.map(mapDevotional);
}

export async function getMarriageDevotional(id: string) {
  const row = await prisma.coupleMarriageDevotional.findUnique({ where: { id } });
  return row ? mapDevotional(row) : null;
}

export async function createMarriageDevotional(input: {
  publishDate: string;
  title: string;
  scripture: string;
  teaching: string;
  discussion: string;
  assignment: string;
  prayer: string;
  declaration: string;
  published: boolean;
  createdBy: string;
  createdByName: string;
}) {
  const row = await prisma.coupleMarriageDevotional.create({
    data: {
      id: `cmdev-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      ...input,
      title: input.title.trim(),
    },
  });
  return mapDevotional(row);
}

export async function updateMarriageDevotional(
  id: string,
  input: Partial<Omit<CoupleMarriageDevotionalRecord, "id" | "createdAt" | "updatedAt" | "createdBy" | "createdByName">>,
) {
  const row = await prisma.coupleMarriageDevotional.update({
    where: { id },
    data: input,
  });
  return mapDevotional(row);
}

export async function markDevotionalRead(input: {
  coupleLinkId: string;
  devotionalId: string;
  readByUserId: string;
}) {
  await prisma.coupleDevotionalRead.upsert({
    where: {
      coupleLinkId_devotionalId_readByUserId: {
        coupleLinkId: input.coupleLinkId,
        devotionalId: input.devotionalId,
        readByUserId: input.readByUserId,
      },
    },
    create: input,
    update: { readAt: new Date() },
  });
}

export async function listDevotionalReads(coupleLinkId: string) {
  return prisma.coupleDevotionalRead.findMany({ where: { coupleLinkId } });
}
