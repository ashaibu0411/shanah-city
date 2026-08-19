import { promises as fs } from "fs";
import path from "path";
import type { GroupChatMessage } from "@/lib/group-types";

const CHAT_FILE = path.join(process.cwd(), "data", "group-chat-messages.json");
const MAX_MESSAGES_PER_GROUP = 500;

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

async function readMessages() {
  return readJson<GroupChatMessage[]>(CHAT_FILE, []);
}

export async function listGroupChatMessages(groupId: string, options?: { after?: string }) {
  const all = await readMessages();
  let messages = all
    .filter((message) => message.groupId === groupId)
    .sort((left, right) => new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime());

  if (options?.after) {
    const afterTime = Date.parse(options.after);
    if (Number.isFinite(afterTime)) {
      messages = messages.filter((message) => Date.parse(message.createdAt) > afterTime);
    }
  }

  return messages.slice(-100);
}

export async function addGroupChatMessage(input: {
  groupId: string;
  groupName: string;
  senderId: string;
  senderName: string;
  content: string;
}) {
  const content = input.content.trim();
  if (!content) {
    throw new Error("Message cannot be empty.");
  }
  if (content.length > 2000) {
    throw new Error("Message is too long (2000 characters max).");
  }

  const all = await readMessages();
  const message: GroupChatMessage = {
    id: `group-msg-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    groupId: input.groupId,
    groupName: input.groupName,
    senderId: input.senderId,
    senderName: input.senderName,
    content,
    createdAt: new Date().toISOString(),
  };

  const otherMessages = all.filter((entry) => entry.groupId !== input.groupId);
  const groupMessages = all.filter((entry) => entry.groupId === input.groupId);
  const keptGroupMessages = [...groupMessages, message].slice(-MAX_MESSAGES_PER_GROUP);

  await writeJson(CHAT_FILE, [...otherMessages, ...keptGroupMessages]);
  return message;
}

export async function deleteGroupChatMessagesForGroup(groupId: string) {
  const all = await readMessages();
  await writeJson(
    CHAT_FILE,
    all.filter((message) => message.groupId !== groupId),
  );
}
