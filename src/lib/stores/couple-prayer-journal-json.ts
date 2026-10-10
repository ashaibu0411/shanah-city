import { promises as fs } from "fs";
import path from "path";
import type {
  CouplePrayerJournalCategoryId,
  CouplePrayerJournalEntryRecord,
  CouplePrayerJournalPrivacy,
  CouplePrayerJournalStatus,
} from "@/lib/couple-prayer-journal-types";

const FILE = path.join(process.cwd(), "data", "couple-prayer-journal.json");

async function readAll() {
  try {
    const raw = JSON.parse(await fs.readFile(FILE, "utf-8")) as CouplePrayerJournalEntryRecord[];
    return raw.map((entry) => ({
      ...entry,
      category: (entry.category ?? "our-marriage") as CouplePrayerJournalCategoryId,
      privacy: (entry.privacy ?? "couple") as CouplePrayerJournalPrivacy,
    }));
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
  category: CouplePrayerJournalCategoryId;
  scriptureRef?: string;
  privacy: CouplePrayerJournalPrivacy;
}) {
  const entries = await readAll();
  const now = new Date().toISOString();
  const record: CouplePrayerJournalEntryRecord = {
    id: `cpj-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    coupleLinkId: input.coupleLinkId,
    createdBy: input.createdBy,
    title: input.title.trim(),
    body: input.body.trim(),
    category: input.category,
    scriptureRef: input.scriptureRef,
    privacy: input.privacy,
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
  const entries = await readAll();
  const index = entries.findIndex((e) => e.id === id);
  if (index === -1) throw new Error("Entry not found.");
  const current = entries[index];
  const answeredAtIso =
    input.answeredAt === undefined
      ? input.status === "answered"
        ? new Date().toISOString()
        : input.status === "praying"
          ? undefined
          : current.answeredAt
      : input.answeredAt === null
        ? undefined
        : input.answeredAt.toISOString();

  entries[index] = {
    ...current,
    ...(input.title !== undefined ? { title: input.title.trim() } : {}),
    ...(input.body !== undefined ? { body: input.body.trim() } : {}),
    ...(input.category !== undefined ? { category: input.category } : {}),
    ...(input.scriptureRef !== undefined ? { scriptureRef: input.scriptureRef } : {}),
    ...(input.privacy !== undefined ? { privacy: input.privacy } : {}),
    ...(input.status !== undefined ? { status: input.status } : {}),
    ...(answeredAtIso !== undefined || input.status !== undefined || input.answeredAt !== undefined
      ? { answeredAt: answeredAtIso }
      : {}),
    ...(input.testimony !== undefined ? { testimony: input.testimony } : {}),
    ...(input.thanksgivingScripture !== undefined
      ? { thanksgivingScripture: input.thanksgivingScripture }
      : {}),
    ...(input.answeredPhotoKey !== undefined ? { answeredPhotoKey: input.answeredPhotoKey } : {}),
    updatedAt: new Date().toISOString(),
  };
  await writeAll(entries);
  return entries[index];
}

export async function deletePrayerJournalEntry(id: string) {
  await writeAll((await readAll()).filter((e) => e.id !== id));
}
