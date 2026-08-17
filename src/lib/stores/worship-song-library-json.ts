import { promises as fs } from "fs";
import path from "path";
import type { WorshipLibrarySong } from "@/lib/worship-types";

const DATA_DIR = path.join(process.cwd(), "data");
const LIBRARY_FILE = path.join(DATA_DIR, "worship-song-library.json");

async function readJson<T>(file: string, fallback: T): Promise<T> {
  try {
    const raw = await fs.readFile(file, "utf-8");
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

async function writeJson<T>(file: string, data: T) {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(file, JSON.stringify(data, null, 2));
}

async function readSongs() {
  return readJson<WorshipLibrarySong[]>(LIBRARY_FILE, []);
}

export async function listWorshipLibrarySongs(query?: string) {
  let songs = [...(await readSongs())].sort(
    (left, right) => right.useCount - left.useCount || left.title.localeCompare(right.title),
  );

  if (query?.trim()) {
    const needle = query.trim().toLowerCase();
    songs = songs.filter(
      (song) =>
        song.title.toLowerCase().includes(needle) ||
        song.artist?.toLowerCase().includes(needle) ||
        song.tags?.some((tag) => tag.toLowerCase().includes(needle)),
    );
  }

  return songs;
}

export async function getWorshipLibrarySong(id: string) {
  const songs = await readSongs();
  return songs.find((song) => song.id === id) ?? null;
}

export async function saveWorshipLibrarySong(input: {
  id?: string;
  title: string;
  artist?: string;
  defaultKey: string;
  bpm?: number;
  ccliNumber?: string;
  chartUrl?: string;
  chartFileName?: string;
  notes?: string;
  tags?: string[];
  actor: { id: string; name: string };
}) {
  const songs = await readSongs();
  const now = new Date().toISOString();
  const payload: WorshipLibrarySong = {
    id: input.id ?? `worship-song-${Date.now()}`,
    title: input.title.trim(),
    artist: input.artist?.trim(),
    defaultKey: input.defaultKey.trim() || "C",
    bpm: input.bpm,
    ccliNumber: input.ccliNumber?.trim(),
    chartUrl: input.chartUrl?.trim(),
    chartFileName: input.chartFileName?.trim(),
    notes: input.notes?.trim(),
    tags: input.tags ?? [],
    useCount: input.id ? songs.find((song) => song.id === input.id)?.useCount ?? 0 : 0,
    createdBy: input.id
      ? songs.find((song) => song.id === input.id)?.createdBy ?? input.actor.id
      : input.actor.id,
    createdByName: input.id
      ? songs.find((song) => song.id === input.id)?.createdByName ?? input.actor.name
      : input.actor.name,
    createdAt: input.id
      ? songs.find((song) => song.id === input.id)?.createdAt ?? now
      : now,
    updatedAt: now,
  };

  const index = songs.findIndex((song) => song.id === payload.id);
  if (index >= 0) {
    songs[index] = payload;
  } else {
    songs.push(payload);
  }

  await writeJson(LIBRARY_FILE, songs);
  return payload;
}

export async function incrementWorshipLibraryUseCount(id: string) {
  const songs = await readSongs();
  const index = songs.findIndex((song) => song.id === id);
  if (index === -1) return;
  songs[index] = { ...songs[index], useCount: songs[index].useCount + 1 };
  await writeJson(LIBRARY_FILE, songs);
}

export async function deleteWorshipLibrarySong(id: string) {
  const songs = await readSongs();
  const next = songs.filter((song) => song.id !== id);
  if (next.length === songs.length) return false;
  await writeJson(LIBRARY_FILE, next);
  return true;
}
