import { promises as fs } from "fs";
import path from "path";
import type { ChatMessageReaction } from "@/lib/chat-utils";

const DATA_DIR = path.join(process.cwd(), "data");
const REACTIONS_FILE = path.join(DATA_DIR, "devotion-reactions.json");

type DevotionReactionRecord = {
  id: string;
  devotionId: string;
  userId: string;
  userName: string;
  emoji: string;
  createdAt: string;
};

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

function mapReaction(record: DevotionReactionRecord): ChatMessageReaction {
  return {
    emoji: record.emoji,
    userId: record.userId,
    userName: record.userName,
  };
}

export async function getDevotionReactions(devotionId: string): Promise<ChatMessageReaction[]> {
  const records = await readJson<DevotionReactionRecord[]>(REACTIONS_FILE, []);
  return records.filter((record) => record.devotionId === devotionId).map(mapReaction);
}

export async function toggleDevotionReaction(input: {
  devotionId: string;
  userId: string;
  userName: string;
  emoji: string;
}): Promise<ChatMessageReaction[]> {
  const records = await readJson<DevotionReactionRecord[]>(REACTIONS_FILE, []);
  const index = records.findIndex(
    (record) =>
      record.devotionId === input.devotionId &&
      record.userId === input.userId &&
      record.emoji === input.emoji,
  );

  const next =
    index >= 0
      ? records.filter((_, itemIndex) => itemIndex !== index)
      : [
          ...records,
          {
            id: `dev-react-${Date.now()}`,
            devotionId: input.devotionId,
            userId: input.userId,
            userName: input.userName,
            emoji: input.emoji,
            createdAt: new Date().toISOString(),
          },
        ];

  await writeJson(REACTIONS_FILE, next);
  return next.filter((record) => record.devotionId === input.devotionId).map(mapReaction);
}

export async function deleteDevotionReactionsForUser(userId: string) {
  const records = await readJson<DevotionReactionRecord[]>(REACTIONS_FILE, []);
  await writeJson(
    REACTIONS_FILE,
    records.filter((record) => record.userId !== userId),
  );
}
