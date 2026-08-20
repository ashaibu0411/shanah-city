import { promises as fs } from "fs";
import path from "path";
import type { FeedReadKey } from "@/lib/notification-types";

const FILE = path.join(process.cwd(), "data", "feed-read-state.json");

type FeedReadRecord = {
  userId: string;
  feedKey: FeedReadKey;
  lastReadAt: string;
};

async function readRecords() {
  try {
    const raw = await fs.readFile(FILE, "utf-8");
    return JSON.parse(raw) as FeedReadRecord[];
  } catch {
    return [];
  }
}

async function writeRecords(records: FeedReadRecord[]) {
  await fs.mkdir(path.dirname(FILE), { recursive: true });
  await fs.writeFile(FILE, JSON.stringify(records, null, 2));
}

export async function getFeedLastReads(userId: string) {
  const records = await readRecords();
  return Object.fromEntries(
    records
      .filter((record) => record.userId === userId)
      .map((record) => [record.feedKey, record.lastReadAt]),
  ) as Partial<Record<FeedReadKey, string>>;
}

export async function markFeedRead(userId: string, feedKey: FeedReadKey) {
  const records = await readRecords();
  const now = new Date().toISOString();
  const index = records.findIndex(
    (record) => record.userId === userId && record.feedKey === feedKey,
  );
  if (index === -1) {
    records.push({ userId, feedKey, lastReadAt: now });
  } else {
    records[index] = { ...records[index], lastReadAt: now };
  }
  await writeRecords(records);
}

export async function markFeedsRead(userId: string, feedKeys: FeedReadKey[]) {
  for (const feedKey of feedKeys) {
    await markFeedRead(userId, feedKey);
  }
}
