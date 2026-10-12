import { randomUUID } from "crypto";
import { promises as fs } from "fs";
import path from "path";
import type { ChoirMinistryAnnouncement } from "@/lib/choir-announcements-types";

const FILE = path.join(process.cwd(), "data", "choir-announcements.json");

async function readAll(): Promise<ChoirMinistryAnnouncement[]> {
  try {
    const raw = await fs.readFile(FILE, "utf-8");
    return JSON.parse(raw) as ChoirMinistryAnnouncement[];
  } catch {
    return [];
  }
}

async function writeAll(rows: ChoirMinistryAnnouncement[]) {
  await fs.mkdir(path.dirname(FILE), { recursive: true });
  await fs.writeFile(FILE, JSON.stringify(rows, null, 2));
}

export async function listChoirAnnouncementsJson(groupId: string) {
  const rows = await readAll();
  return rows
    .filter((row) => row.groupId === groupId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export async function createChoirAnnouncementJson(
  input: Omit<ChoirMinistryAnnouncement, "id" | "createdAt">,
) {
  const record: ChoirMinistryAnnouncement = {
    ...input,
    id: randomUUID(),
    createdAt: new Date().toISOString(),
  };
  const rows = await readAll();
  rows.push(record);
  await writeAll(rows.slice(-2000));
  return record;
}

export async function deleteChoirAnnouncementJson(groupId: string, id: string) {
  const rows = await readAll();
  const index = rows.findIndex((row) => row.groupId === groupId && row.id === id);
  if (index < 0) return false;
  rows.splice(index, 1);
  await writeAll(rows);
  return true;
}
