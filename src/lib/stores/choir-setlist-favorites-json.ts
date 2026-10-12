import { promises as fs } from "fs";
import path from "path";

const FILE = path.join(process.cwd(), "data", "choir-setlist-favorites.json");

type ChoirSetlistFavoritesRecord = {
  userId: string;
  songIds: string[];
  updatedAt: string;
};

async function readRecords(): Promise<ChoirSetlistFavoritesRecord[]> {
  try {
    const raw = await fs.readFile(FILE, "utf-8");
    return JSON.parse(raw) as ChoirSetlistFavoritesRecord[];
  } catch {
    return [];
  }
}

async function writeRecords(records: ChoirSetlistFavoritesRecord[]) {
  await fs.mkdir(path.dirname(FILE), { recursive: true });
  await fs.writeFile(FILE, JSON.stringify(records, null, 2));
}

export async function getChoirSetlistFavoriteIds(userId: string) {
  const records = await readRecords();
  const match = records.find((row) => row.userId === userId);
  return match?.songIds ?? [];
}

export async function toggleChoirSetlistFavorite(userId: string, songId: string) {
  const trimmed = songId.trim();
  if (!trimmed) {
    return getChoirSetlistFavoriteIds(userId);
  }

  const records = await readRecords();
  const index = records.findIndex((row) => row.userId === userId);
  const current = index >= 0 ? [...records[index].songIds] : [];
  const next = current.includes(trimmed)
    ? current.filter((id) => id !== trimmed)
    : [...current, trimmed];

  const record: ChoirSetlistFavoritesRecord = {
    userId,
    songIds: next,
    updatedAt: new Date().toISOString(),
  };

  if (index >= 0) {
    records[index] = record;
  } else {
    records.push(record);
  }

  await writeRecords(records.slice(-5000));
  return next;
}
