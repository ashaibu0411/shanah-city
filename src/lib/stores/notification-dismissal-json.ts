import { promises as fs } from "fs";
import path from "path";

const FILE = path.join(process.cwd(), "data", "notification-dismissals.json");

type DismissalRecord = {
  userId: string;
  itemId: string;
  dismissedThroughAt: string;
};

export type NotificationDismissalInput = {
  itemId: string;
  throughAt: string;
};

async function readRecords() {
  try {
    const raw = await fs.readFile(FILE, "utf-8");
    const parsed = JSON.parse(raw) as DismissalRecord[];
    return parsed.map((record) => ({
      ...record,
      dismissedThroughAt:
        record.dismissedThroughAt ??
        ((record as { dismissedAt?: string }).dismissedAt ?? new Date().toISOString()),
    }));
  } catch {
    return [];
  }
}

async function writeRecords(records: DismissalRecord[]) {
  await fs.mkdir(path.dirname(FILE), { recursive: true });
  await fs.writeFile(FILE, JSON.stringify(records, null, 2));
}

export async function getDismissedNotificationWatermarks(userId: string) {
  const records = await readRecords();
  const map = new Map<string, Date>();
  for (const record of records.filter((row) => row.userId === userId)) {
    const through = new Date(record.dismissedThroughAt);
    if (!Number.isNaN(through.getTime())) {
      map.set(record.itemId, through);
    }
  }
  return map;
}

export async function dismissNotificationItems(userId: string, inputs: NotificationDismissalInput[]) {
  if (inputs.length === 0) return;

  const records = await readRecords();
  const byKey = new Map(
    records
      .filter((record) => record.userId === userId)
      .map((record) => [record.itemId, record] as const),
  );

  for (const input of inputs) {
    const through = new Date(input.throughAt);
    if (Number.isNaN(through.getTime())) continue;

    const existing = byKey.get(input.itemId);
    if (!existing) {
      const created: DismissalRecord = {
        userId,
        itemId: input.itemId,
        dismissedThroughAt: through.toISOString(),
      };
      records.push(created);
      byKey.set(input.itemId, created);
      continue;
    }

    const prev = new Date(existing.dismissedThroughAt);
    if (through > prev) {
      existing.dismissedThroughAt = through.toISOString();
    }
  }

  await writeRecords(records);
}