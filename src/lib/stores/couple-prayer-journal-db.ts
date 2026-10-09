import { prisma } from "@/lib/db";
import type { CouplePrayerJournalEntryRecord, CouplePrayerJournalStatus } from "@/lib/couple-prayer-journal-types";

function mapRow(row: {
  id: string;
  coupleLinkId: string;
  createdBy: string;
  title: string;
  body: string;
  status: string;
  answeredAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}): CouplePrayerJournalEntryRecord {
  return {
    id: row.id,
    coupleLinkId: row.coupleLinkId,
    createdBy: row.createdBy,
    title: row.title,
    body: row.body,
    status: row.status as CouplePrayerJournalStatus,
    answeredAt: row.answeredAt?.toISOString(),
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
}) {
  const row = await prisma.couplePrayerJournalEntry.create({
    data: {
      id: `cpj-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      coupleLinkId: input.coupleLinkId,
      createdBy: input.createdBy,
      title: input.title.trim(),
      body: input.body.trim(),
      status: "praying",
    },
  });
  return mapRow(row);
}

export async function updatePrayerJournalEntry(
  id: string,
  input: { title?: string; body?: string; status?: CouplePrayerJournalStatus },
) {
  const row = await prisma.couplePrayerJournalEntry.update({
    where: { id },
    data: {
      ...(input.title !== undefined ? { title: input.title.trim() } : {}),
      ...(input.body !== undefined ? { body: input.body.trim() } : {}),
      ...(input.status !== undefined
        ? {
            status: input.status,
            answeredAt: input.status === "answered" ? new Date() : null,
          }
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
