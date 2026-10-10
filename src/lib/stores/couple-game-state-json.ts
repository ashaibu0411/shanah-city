import { promises as fs } from "fs";
import path from "path";
import type { CoupleGameStateRecord } from "@/lib/stores/couple-game-state-db";

const DATA_DIR = path.join(process.cwd(), "data");
const FILE = path.join(DATA_DIR, "couple-game-states.json");

async function readAll() {
  try {
    return JSON.parse(await fs.readFile(FILE, "utf-8")) as CoupleGameStateRecord[];
  } catch {
    return [];
  }
}

async function writeAll(rows: CoupleGameStateRecord[]) {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(FILE, JSON.stringify(rows, null, 2));
}

export async function getCoupleGameState(coupleLinkId: string, gameType: string) {
  const rows = await readAll();
  return rows.find((row) => row.coupleLinkId === coupleLinkId && row.gameType === gameType) ?? null;
}

export async function upsertCoupleGameState(input: {
  coupleLinkId: string;
  gameType: string;
  stateJson: string;
}) {
  const rows = await readAll();
  const index = rows.findIndex(
    (row) => row.coupleLinkId === input.coupleLinkId && row.gameType === input.gameType,
  );
  const now = new Date().toISOString();
  const record: CoupleGameStateRecord = {
    id:
      index >= 0
        ? rows[index].id
        : `cgame-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    coupleLinkId: input.coupleLinkId,
    gameType: input.gameType,
    stateJson: input.stateJson,
    updatedAt: now,
  };
  if (index >= 0) rows[index] = record;
  else rows.push(record);
  await writeAll(rows);
  return record;
}
