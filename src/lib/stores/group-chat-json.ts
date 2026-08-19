import { promises as fs } from "fs";
import path from "path";
import type { GroupChatMessage } from "@/lib/group-types";
import {
  normalizeChatReactions,
  toggleChatReaction,
  validateChatContent,
} from "@/lib/chat-utils";

const CHAT_FILE = path.join(process.cwd(), "data", "group-chat-messages.json");
const READ_FILE = path.join(process.cwd(), "data", "group-chat-read-state.json");
const MAX_MESSAGES_PER_GROUP = 500;

type ReadState = {
  groupId: string;
  userId: string;
  lastReadAt: string;
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
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(file, JSON.stringify(data, null, 2));
}

async function readMessages() {
  return readJson<GroupChatMessage[]>(CHAT_FILE, []);
}

async function readReadStates() {
  return readJson<ReadState[]>(READ_FILE, []);
}

function mapExtras(message: GroupChatMessage): GroupChatMessage {
  return {
    ...message,
    reactions: normalizeChatReactions(message.reactions),
  };
}

function computeSeenCount(
  message: GroupChatMessage,
  readStates: ReadState[],
  memberIds: string[],
) {
  const messageTime = Date.parse(message.createdAt);
  if (!Number.isFinite(messageTime)) return 0;
  return readStates.filter((state) => {
    if (state.userId === message.senderId) return false;
    if (!memberIds.includes(state.userId)) return false;
    return Date.parse(state.lastReadAt) >= messageTime;
  }).length;
}

export async function listGroupChatMessages(
  groupId: string,
  options?: { after?: string; viewerId?: string; memberIds?: string[] },
) {
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

  const readStates = await readReadStates();
  const memberIds = options?.memberIds ?? [];

  return messages.slice(-100).map((message) => {
    const mapped = mapExtras(message);
    if (options?.viewerId && message.senderId === options.viewerId && memberIds.length > 0) {
      mapped.seenCount = computeSeenCount(message, readStates.filter((s) => s.groupId === groupId), memberIds);
    }
    return mapped;
  });
}

export async function addGroupChatMessage(input: {
  groupId: string;
  groupName: string;
  senderId: string;
  senderName: string;
  content: string;
  attachmentUrl?: string;
  attachmentType?: string;
  attachmentName?: string;
}) {
  const content = validateChatContent(input.content, Boolean(input.attachmentUrl));

  const all = await readMessages();
  const message: GroupChatMessage = {
    id: `group-msg-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    groupId: input.groupId,
    groupName: input.groupName,
    senderId: input.senderId,
    senderName: input.senderName,
    content,
    reactions: [],
    attachmentUrl: input.attachmentUrl,
    attachmentType: input.attachmentType,
    attachmentName: input.attachmentName,
    createdAt: new Date().toISOString(),
  };

  const otherMessages = all.filter((entry) => entry.groupId !== input.groupId);
  const groupMessages = all.filter((entry) => entry.groupId === input.groupId);
  const keptGroupMessages = [...groupMessages, message].slice(-MAX_MESSAGES_PER_GROUP);

  await writeJson(CHAT_FILE, [...otherMessages, ...keptGroupMessages]);
  await markGroupChatRead(input.groupId, input.senderId);
  return message;
}

export async function editGroupChatMessage(input: {
  groupId: string;
  messageId: string;
  userId: string;
  content: string;
}) {
  const content = validateChatContent(input.content, false);
  const all = await readMessages();
  const index = all.findIndex(
    (message) => message.id === input.messageId && message.groupId === input.groupId,
  );
  if (index === -1) return null;

  const message = all[index];
  if (message.senderId !== input.userId) {
    throw new Error("You can only edit your own messages.");
  }
  if (message.deletedAt) {
    throw new Error("Deleted messages cannot be edited.");
  }

  const updated = { ...message, content, editedAt: new Date().toISOString() };
  all[index] = updated;
  await writeJson(CHAT_FILE, all);
  return mapExtras(updated);
}

export async function deleteGroupChatMessage(input: {
  groupId: string;
  messageId: string;
  userId: string;
  isGroupAdmin?: boolean;
}) {
  const all = await readMessages();
  const index = all.findIndex(
    (message) => message.id === input.messageId && message.groupId === input.groupId,
  );
  if (index === -1) return null;

  const message = all[index];
  if (message.senderId !== input.userId && !input.isGroupAdmin) {
    throw new Error("You can only delete your own messages.");
  }

  const updated = {
    ...message,
    content: "",
    deletedAt: new Date().toISOString(),
  };
  all[index] = updated;
  await writeJson(CHAT_FILE, all);
  return mapExtras(updated);
}

export async function markGroupChatRead(groupId: string, userId: string) {
  const states = await readReadStates();
  const now = new Date().toISOString();
  const index = states.findIndex((state) => state.groupId === groupId && state.userId === userId);
  if (index === -1) {
    states.push({ groupId, userId, lastReadAt: now });
  } else {
    states[index] = { ...states[index], lastReadAt: now };
  }
  await writeJson(READ_FILE, states);
}

export async function deleteGroupChatMessagesForGroup(groupId: string) {
  const all = await readMessages();
  await writeJson(
    CHAT_FILE,
    all.filter((message) => message.groupId !== groupId),
  );
  const states = await readReadStates();
  await writeJson(
    READ_FILE,
    states.filter((state) => state.groupId !== groupId),
  );
}

export async function toggleGroupChatReaction(input: {
  groupId: string;
  messageId: string;
  emoji: string;
  userId: string;
  userName: string;
}) {
  const all = await readMessages();
  const index = all.findIndex(
    (message) => message.id === input.messageId && message.groupId === input.groupId,
  );
  if (index === -1) return null;

  const message = all[index];
  const reactions = toggleChatReaction(message.reactions, input.emoji, {
    id: input.userId,
    name: input.userName,
  });
  const updated = { ...message, reactions };
  all[index] = updated;
  await writeJson(CHAT_FILE, all);
  return mapExtras(updated);
}
