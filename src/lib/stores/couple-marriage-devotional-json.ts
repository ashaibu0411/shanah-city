import { promises as fs } from "fs";
import path from "path";
import type { CoupleDevotionalReadRecord, CoupleMarriageDevotionalRecord } from "@/lib/couple-marriage-devotional-types";

const DEV_FILE = path.join(process.cwd(), "data", "couple-marriage-devotionals.json");
const READ_FILE = path.join(process.cwd(), "data", "couple-devotional-reads.json");

async function readDevs() {
  try {
    return JSON.parse(await fs.readFile(DEV_FILE, "utf-8")) as CoupleMarriageDevotionalRecord[];
  } catch {
    return [];
  }
}

async function writeDevs(items: CoupleMarriageDevotionalRecord[]) {
  await fs.mkdir(path.dirname(DEV_FILE), { recursive: true });
  await fs.writeFile(DEV_FILE, JSON.stringify(items, null, 2));
}

async function readReads() {
  try {
    return JSON.parse(await fs.readFile(READ_FILE, "utf-8")) as CoupleDevotionalReadRecord[];
  } catch {
    return [];
  }
}

async function writeReads(items: CoupleDevotionalReadRecord[]) {
  await fs.mkdir(path.dirname(READ_FILE), { recursive: true });
  await fs.writeFile(READ_FILE, JSON.stringify(items, null, 2));
}

export async function listMarriageDevotionals(options: { publishedOnly?: boolean }) {
  const items = await readDevs();
  const filtered = options.publishedOnly ? items.filter((d) => d.published) : items;
  return filtered.sort((a, b) => b.publishDate.localeCompare(a.publishDate));
}

export async function getMarriageDevotional(id: string) {
  return (await readDevs()).find((d) => d.id === id) ?? null;
}

export async function createMarriageDevotional(input: Omit<CoupleMarriageDevotionalRecord, "id" | "createdAt" | "updatedAt">) {
  const items = await readDevs();
  const now = new Date().toISOString();
  const record: CoupleMarriageDevotionalRecord = {
    ...input,
    id: `cmdev-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    title: input.title.trim(),
    createdAt: now,
    updatedAt: now,
  };
  items.push(record);
  await writeDevs(items);
  return record;
}

export async function updateMarriageDevotional(
  id: string,
  input: Partial<CoupleMarriageDevotionalRecord>,
) {
  const items = await readDevs();
  const index = items.findIndex((d) => d.id === id);
  if (index === -1) throw new Error("Devotional not found.");
  items[index] = { ...items[index], ...input, updatedAt: new Date().toISOString() };
  await writeDevs(items);
  return items[index];
}

export async function markDevotionalRead(input: CoupleDevotionalReadRecord) {
  const reads = await readReads();
  const index = reads.findIndex(
    (r) =>
      r.coupleLinkId === input.coupleLinkId &&
      r.devotionalId === input.devotionalId &&
      r.readByUserId === input.readByUserId,
  );
  const record = { ...input, readAt: new Date().toISOString() };
  if (index >= 0) reads[index] = record;
  else reads.push(record);
  await writeReads(reads);
}

export async function listDevotionalReads(coupleLinkId: string) {
  return (await readReads()).filter((r) => r.coupleLinkId === coupleLinkId);
}
