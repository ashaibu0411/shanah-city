import { prisma } from "@/lib/db";
import type { CoupleLoveNoteRecord, CoupleLoveNoteType } from "@/lib/couple-love-note-types";

function mapRow(row: {
  id: string;
  coupleLinkId: string;
  fromUserId: string;
  noteType: string;
  body: string;
  scriptureRef: string | null;
  readAt: Date | null;
  createdAt: Date;
}): CoupleLoveNoteRecord {
  return {
    id: row.id,
    coupleLinkId: row.coupleLinkId,
    fromUserId: row.fromUserId,
    noteType: row.noteType as CoupleLoveNoteType,
    body: row.body,
    scriptureRef: row.scriptureRef ?? undefined,
    readAt: row.readAt?.toISOString(),
    createdAt: row.createdAt.toISOString(),
  };
}

export async function listCoupleLoveNotes(coupleLinkId: string) {
  const rows = await prisma.coupleLoveNote.findMany({
    where: { coupleLinkId },
    orderBy: { createdAt: "desc" },
  });
  return rows.map(mapRow);
}

export async function getCoupleLoveNoteById(id: string) {
  const row = await prisma.coupleLoveNote.findUnique({ where: { id } });
  return row ? mapRow(row) : null;
}

export async function createCoupleLoveNote(input: {
  coupleLinkId: string;
  fromUserId: string;
  noteType: CoupleLoveNoteType;
  body: string;
  scriptureRef?: string;
}) {
  const row = await prisma.coupleLoveNote.create({
    data: {
      id: `clnote-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      coupleLinkId: input.coupleLinkId,
      fromUserId: input.fromUserId,
      noteType: input.noteType,
      body: input.body.trim(),
      scriptureRef: input.scriptureRef?.trim() || null,
    },
  });
  return mapRow(row);
}

export async function markCoupleLoveNoteRead(id: string, readAt: Date) {
  const row = await prisma.coupleLoveNote.update({
    where: { id },
    data: { readAt },
  });
  return mapRow(row);
}

export async function deleteCoupleLoveNote(id: string) {
  await prisma.coupleLoveNote.delete({ where: { id } });
}
