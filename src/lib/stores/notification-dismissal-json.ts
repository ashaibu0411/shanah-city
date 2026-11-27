import { promises as fs } from "fs";
import path from "path";

const FILE = path.join(process.cwd(), "data", "notification-dismissals.json");

type DismissalRecord = {
  userId: string;
  itemId: string;
  dismissedAt: string;
};

async function readRecords() {
  try {
    const raw = await fs.readFile(FILE, "utf-8");
    return JSON.parse(raw) as DismissalRecord[];
  } catch {
    return [];
  }
}

async function writeRecords(records: DismissalRecord[]) {
  await fs.mkdir(path.dirname(FILE), { recursive: true });
  await fs.writeFile(FILE, JSON.stringify(records, null, 2));
}

export async function getDismissedNotificationItemIds(userId: string) {
  const records = await readRecords();
  return new Set(records.filter((record) => record.userId === userId).map((record) => record.itemId));
}

export async function dismissNotificationItemIds(userId: string, itemIds: string[]) {
  if (itemIds.length === 0) return;

  const records = await readRecords();
  const now = new Date().toISOString();
  const existing = new Set(
    records.filter((record) => record.userId === userId).map((record) => record.itemId),
  );

  for (const itemId of itemIds) {
    if (existing.has(itemId)) continue;
    records.push({ userId, itemId, dismissedAt: now });
    existing.add(itemId);
  }

  await writeRecords(records);
}