import { promises as fs } from "fs";
import path from "path";
import type { CoupleLoveNoteRecord, CoupleLoveNoteType } from "@/lib/couple-love-note-types";

const DATA_DIR = path.join(process.cwd(), "data");
const FILE = path.join(DATA_DIR, "couple-love-notes.json");

async function readNotes() {
  try {
    const raw = await fs.readFile(FILE, "utf-8");
    return JSON.parse(raw) as CoupleLoveNoteRecord[];
  } catch {
    return [];
  }
}

async function writeNotes(notes: CoupleLoveNoteRecord[]) {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(FILE, JSON.stringify(notes, null, 2));
}

export async function listCoupleLoveNotes(coupleLinkId: string) {
  const notes = await readNotes();
  return notes
    .filter((note) => note.coupleLinkId === coupleLinkId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function getCoupleLoveNoteById(id: string) {
  const notes = await readNotes();
  return notes.find((note) => note.id === id) ?? null;
}

export async function createCoupleLoveNote(input: {
  coupleLinkId: string;
  fromUserId: string;
  noteType: CoupleLoveNoteType;
  body: string;
  scriptureRef?: string;
}) {
  const notes = await readNotes();
  const record: CoupleLoveNoteRecord = {
    id: `clnote-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    coupleLinkId: input.coupleLinkId,
    fromUserId: input.fromUserId,
    noteType: input.noteType,
    body: input.body.trim(),
    scriptureRef: input.scriptureRef?.trim() || undefined,
    createdAt: new Date().toISOString(),
  };
  notes.push(record);
  await writeNotes(notes);
  return record;
}

export async function markCoupleLoveNoteRead(id: string, readAt: Date) {
  const notes = await readNotes();
  const index = notes.findIndex((note) => note.id === id);
  if (index === -1) throw new Error("Note not found.");
  notes[index] = { ...notes[index], readAt: readAt.toISOString() };
  await writeNotes(notes);
  return notes[index];
}

export async function deleteCoupleLoveNote(id: string) {
  const notes = await readNotes();
  await writeNotes(notes.filter((note) => note.id !== id));
}
