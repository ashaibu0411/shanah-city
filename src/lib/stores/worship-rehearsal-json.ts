import { promises as fs } from "fs";
import path from "path";
import type { WorshipRehearsalRecording } from "@/lib/worship-types";

const RECORDINGS_FILE = path.join(process.cwd(), "data", "worship-rehearsals.json");

async function readJson<T>(file: string, fallback: T): Promise<T> {
  try {
    const raw = await fs.readFile(file, "utf-8");
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

async function writeJson<T>(file: string, data: T) {
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(file, JSON.stringify(data, null, 2));
}

function sortRecordings(recordings: WorshipRehearsalRecording[]) {
  return [...recordings].sort(
    (left, right) => Date.parse(right.createdAt) - Date.parse(left.createdAt),
  );
}

export async function listWorshipRehearsalRecordings(options: {
  serviceDate: string;
  serviceTime: string;
}) {
  const all = await readJson<WorshipRehearsalRecording[]>(RECORDINGS_FILE, []);
  return sortRecordings(
    all.filter(
      (entry) =>
        entry.serviceDate === options.serviceDate && entry.serviceTime === options.serviceTime,
    ),
  );
}

export async function addWorshipRehearsalRecording(recording: WorshipRehearsalRecording) {
  const all = await readJson<WorshipRehearsalRecording[]>(RECORDINGS_FILE, []);
  const next = sortRecordings([recording, ...all.filter((entry) => entry.id !== recording.id)]);
  await writeJson(RECORDINGS_FILE, next);
  return recording;
}

export async function deleteWorshipRehearsalRecording(id: string) {
  const all = await readJson<WorshipRehearsalRecording[]>(RECORDINGS_FILE, []);
  const existing = all.find((entry) => entry.id === id);
  if (!existing) return null;
  await writeJson(
    RECORDINGS_FILE,
    all.filter((entry) => entry.id !== id),
  );
  return existing;
}

export async function getWorshipRehearsalRecording(id: string) {
  const all = await readJson<WorshipRehearsalRecording[]>(RECORDINGS_FILE, []);
  return all.find((entry) => entry.id === id) ?? null;
}
