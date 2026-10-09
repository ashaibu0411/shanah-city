import { promises as fs } from "fs";
import path from "path";
import type { CouplePrayerJournalEntryRecord, CouplePrayerJournalStatus } from "@/lib/couple-prayer-journal-types";

const FILE = path.join(process.cwd(), "data", "couple-prayer-journal.json");

async function readAll() {
  try {
    return JSON.parse(await fs.readFile(FILE, "utf-8")) as CouplePrayerJournalEntryRecord[];
  } catch {
    return [];
  }
}

async function writeAll(entries: CouplePrayerJournalEntryRecord[]) {
  await fs.mkdir(path.dirname(FILE), { recursive: true });
  await fs.writeFile(FILE, JSON.stringify(entries, null, 2));
}

export async function listPrayerJournalEntries(coupleLinkId: string) {
  return (await readAll())
    .filter((e) => e.coupleLinkId === coupleLinkId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function getPrayerJournalEntry(id: string) {
  return (await readAll()).find((e) => e.id === id) ?? null;
}

export async function createPrayerJournalEntry(input: {
  coupleLinkId: string;
  createdBy: string;
  title: string;
  body: string;
}) {
  const entries = await readAll();
  const now = new Date().toISOString();
  const record: CouplePrayerJournalEntryRecord = {
    id: `cpj-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    coupleLinkId: input.coupleLinkId,
    createdBy: input.createdBy,
    title: input.title.trim(),
    body: input.body.trim(),
    status: "praying",
    createdAt: now,
    updatedAt: now,
  };
  entries.push(record);
  await writeAll(entries);
  return record;
}

export async function updatePrayerJournalEntry(
  id: string,
  input: { title?: string; body?: string; status?: CouplePrayerJournalStatus },
) {
  const entries = await readAll();
  const index = entries.findIndex((e) => e.id === id);
  if (index === -1) throw new Error("Entry not found.");
  const current = entries[index];
  entries[index] = {
    ...current,
    ...(input.title !== undefined ? { title: input.title.trim() } : {}),
    ...(input.body !== undefined ? { body: input.body.trim() } : {}),
    ...(input.status !== undefined
      ? {
          status: input.status,
          answeredAt: input.status === "answered" ? new Date().toISOString() : undefined,
        }
      : {}),
    updatedAt: new Date().toISOString(),
  };
  await writeAll(entries);
  return entries[index];
}

export async function deletePrayerJournalEntry(id: string) {
  await writeAll((await readAll()).filter((e) => e.id !== id));
}
