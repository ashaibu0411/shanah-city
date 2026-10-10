import { prisma } from "@/lib/db";
import type {
  CouplePrayerJournalCategoryId,
  CouplePrayerJournalEntryRecord,
  CouplePrayerJournalPrivacy,
  CouplePrayerJournalStatus,
} from "@/lib/couple-prayer-journal-types";

function mapRow(row: {
  id: string;
  coupleLinkId: string;
  createdBy: string;
  title: string;
  body: string;
  category: string;
  scriptureRef: string | null;
  privacy: string;
  status: string;
  answeredAt: Date | null;
  testimony: string | null;
  thanksgivingScripture: string | null;
  answeredPhotoKey: string | null;
  createdAt: Date;
  updatedAt: Date;
}): CouplePrayerJournalEntryRecord {
  return {
    id: row.id,
    coupleLinkId: row.coupleLinkId,
    createdBy: row.createdBy,
    title: row.title,
    body: row.body,
    category: row.category as CouplePrayerJournalCategoryId,
    scriptureRef: row.scriptureRef ?? undefined,
    privacy: row.privacy as CouplePrayerJournalPrivacy,
    status: row.status as CouplePrayerJournalStatus,
    answeredAt: row.answeredAt?.toISOString(),
    testimony: row.testimony ?? undefined,
    thanksgivingScripture: row.thanksgivingScripture ?? undefined,
    answeredPhotoKey: row.answeredPhotoKey ?? undefined,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export async function listPrayerJournalEntries(coupleLinkId: string) {
  const rows = await prisma.couplePrayerJournalEntry.findMany({
    where: { coupleLinkId },
    orderBy: { createdAt: "desc" },
  });
  return rows.map(mapRow);
}

export async function createPrayerJournalEntry(input: {
  coupleLinkId: string;
  createdBy: string;
  title: string;
  body: string;
  category: CouplePrayerJournalCategoryId;
  scriptureRef?: string;
  privacy: CouplePrayerJournalPrivacy;
}) {
  const row = await prisma.couplePrayerJournalEntry.create({
    data: {
      id: `cpj-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      coupleLinkId: input.coupleLinkId,
      createdBy: input.createdBy,
      title: input.title.trim(),
      body: input.body.trim(),
      category: input.category,
      scriptureRef: input.scriptureRef?.trim() || null,
      privacy: input.privacy,
      status: "praying",
    },
  });
  return mapRow(row);
}

export async function updatePrayerJournalEntry(
  id: string,
  input: {
    title?: string;
    body?: string;
    category?: CouplePrayerJournalCategoryId;
    scriptureRef?: string;
    privacy?: CouplePrayerJournalPrivacy;
    status?: CouplePrayerJournalStatus;
    answeredAt?: Date | null;
    testimony?: string;
    thanksgivingScripture?: string;
    answeredPhotoKey?: string;
  },
) {
  const row = await prisma.couplePrayerJournalEntry.update({
    where: { id },
    data: {
      ...(input.title !== undefined ? { title: input.title.trim() } : {}),
      ...(input.body !== undefined ? { body: input.body.trim() } : {}),
      ...(input.category !== undefined ? { category: input.category } : {}),
      ...(input.scriptureRef !== undefined ? { scriptureRef: input.scriptureRef?.trim() || null } : {}),
      ...(input.privacy !== undefined ? { privacy: input.privacy } : {}),
      ...(input.status !== undefined
        ? {
            status: input.status,
            ...(input.answeredAt === undefined
              ? { answeredAt: input.status === "answered" ? new Date() : null }
              : {}),
          }
        : {}),
      ...(input.answeredAt !== undefined ? { answeredAt: input.answeredAt } : {}),
      ...(input.testimony !== undefined ? { testimony: input.testimony?.trim() || null } : {}),
      ...(input.thanksgivingScripture !== undefined
        ? { thanksgivingScripture: input.thanksgivingScripture?.trim() || null }
        : {}),
      ...(input.answeredPhotoKey !== undefined
        ? { answeredPhotoKey: input.answeredPhotoKey?.trim() || null }
        : {}),
    },
  });
  return mapRow(row);
}

export async function deletePrayerJournalEntry(id: string) {
  await prisma.couplePrayerJournalEntry.delete({ where: { id } });
}

export async function getPrayerJournalEntry(id: string) {
  const row = await prisma.couplePrayerJournalEntry.findUnique({ where: { id } });
  return row ? mapRow(row) : null;
}
