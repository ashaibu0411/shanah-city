import { promises as fs } from "fs";
import path from "path";
import type { ChatTypingUser } from "@/lib/chat-utils";

const TYPING_FILE = path.join(process.cwd(), "data", "chat-typing.json");
const TYPING_TTL_MS = 5000;

type TypingRecord = {
  channelType: "group" | "thread";
  channelId: string;
  userId: string;
  userName: string;
  expiresAt: string;
};

async function readRecords() {
  try {
    const raw = await fs.readFile(TYPING_FILE, "utf-8");
    return JSON.parse(raw) as TypingRecord[];
  } catch {
    return [];
  }
}

async function writeRecords(records: TypingRecord[]) {
  await fs.mkdir(path.dirname(TYPING_FILE), { recursive: true });
  await fs.writeFile(TYPING_FILE, JSON.stringify(records, null, 2));
}

function prune(records: TypingRecord[]) {
  const now = Date.now();
  return records.filter((record) => Date.parse(record.expiresAt) > now);
}

export async function setChatTyping(input: {
  channelType: "group" | "thread";
  channelId: string;
  userId: string;
  userName: string;
  isTyping: boolean;
}) {
  const records = prune(await readRecords()).filter(
    (record) =>
      !(
        record.channelType === input.channelType &&
        record.channelId === input.channelId &&
        record.userId === input.userId
      ),
  );

  if (input.isTyping) {
    records.push({
      channelType: input.channelType,
      channelId: input.channelId,
      userId: input.userId,
      userName: input.userName,
      expiresAt: new Date(Date.now() + TYPING_TTL_MS).toISOString(),
    });
  }

  await writeRecords(records);
}

export async function getChatTypingUsers(input: {
  channelType: "group" | "thread";
  channelId: string;
  excludeUserId?: string;
}): Promise<ChatTypingUser[]> {
  const records = prune(await readRecords()).filter(
    (record) =>
      record.channelType === input.channelType &&
      record.channelId === input.channelId &&
      record.userId !== input.excludeUserId,
  );

  const seen = new Set<string>();
  const users: ChatTypingUser[] = [];
  for (const record of records) {
    if (seen.has(record.userId)) continue;
    seen.add(record.userId);
    users.push({ userId: record.userId, userName: record.userName });
  }
  return users;
}
