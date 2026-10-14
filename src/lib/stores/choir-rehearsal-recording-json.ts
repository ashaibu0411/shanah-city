import { promises as fs } from "fs";
import path from "path";
import type { ChoirRehearsalLibraryRecording } from "@/lib/choir-rehearsal-recording-types";

const FILE = path.join(process.cwd(), "data", "choir-rehearsal-recordings.json");

async function readAll(): Promise<ChoirRehearsalLibraryRecording[]> {
  try {
    const raw = await fs.readFile(FILE, "utf-8");
    return JSON.parse(raw) as ChoirRehearsalLibraryRecording[];
  } catch {
    return [];
  }
}

async function writeAll(entries: ChoirRehearsalLibraryRecording[]) {
  await fs.mkdir(path.dirname(FILE), { recursive: true });
  await fs.writeFile(FILE, JSON.stringify(entries, null, 2));
}

function sort(entries: ChoirRehearsalLibraryRecording[]) {
  return [...entries].sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
}

export async function listChoirRehearsalLibraryRecordings(options: {
  groupId: string;
  recordedBy?: string;
  category?: string;
  mediaType?: "audio" | "video";
  includeDeleted?: boolean;
  limit?: number;
  cursorCreatedAt?: string;
}) {
  let all = await readAll();
  all = all.filter((entry) => entry.groupId === options.groupId);
  if (!options.includeDeleted) all = all.filter((entry) => !entry.deletedAt);
  if (options.recordedBy) all = all.filter((entry) => entry.recordedBy === options.recordedBy);
  if (options.category) all = all.filter((entry) => entry.category === options.category);
  if (options.mediaType) all = all.filter((entry) => entry.mediaType === options.mediaType);
  if (options.cursorCreatedAt) {
    const cursor = Date.parse(options.cursorCreatedAt);
    all = all.filter((entry) => Date.parse(entry.createdAt) < cursor);
  }
  all = sort(all);
  return all.slice(0, options.limit ?? 50);
}

export async function getChoirRehearsalLibraryRecording(id: string) {
  const all = await readAll();
  return all.find((entry) => entry.id === id) ?? null;
}

export async function upsertChoirRehearsalLibraryRecording(recording: ChoirRehearsalLibraryRecording) {
  const all = await readAll();
  const next = sort([recording, ...all.filter((entry) => entry.id !== recording.id)]);
  await writeAll(next);
  return recording;
}

export async function softDeleteChoirRehearsalLibraryRecording(id: string) {
  const all = await readAll();
  const existing = all.find((entry) => entry.id === id);
  if (!existing) return null;
  const updated: ChoirRehearsalLibraryRecording = {
    ...existing,
    deletedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  await writeAll(all.map((entry) => (entry.id === id ? updated : entry)));
  return updated;
}
