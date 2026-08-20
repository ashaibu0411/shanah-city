import { promises as fs } from "fs";
import path from "path";
import { getUsers, toPublicMember } from "@/lib/auth-server";
import {
  getBlockedUserIds,
  hasMessagingBlock,
  getMessagingBlockReason,
} from "@/lib/block-server";
import { normalizeChatReactions, toggleChatReaction, validateChatContent } from "@/lib/chat-utils";
import type {
  DirectMessage,
  MemberDirectoryEntry,
  MessageThread,
} from "@/lib/member-types";

const DATA_DIR = path.join(process.cwd(), "data");
const THREADS_FILE = path.join(DATA_DIR, "message-threads.json");
const MESSAGES_FILE = path.join(DATA_DIR, "messages.json");

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

function threadKey(userA: string, userB: string): [string, string] {
  return userA < userB ? [userA, userB] : [userB, userA];
}

function buildThreadId(userA: string, userB: string) {
  const [first, second] = threadKey(userA, userB);
  return `thread-${first}-${second}`;
}

function mapMessage(message: DirectMessage): DirectMessage {
  return {
    ...message,
    reactions: normalizeChatReactions(message.reactions),
  };
}

function previewForMessage(message: DirectMessage) {
  if (message.deletedAt) return "Message deleted";
  if (message.attachmentUrl && !message.content.trim()) return "Photo";
  return message.content.slice(0, 120);
}

export async function getMemberDirectory(currentUserId: string) {
  const users = await getUsers();
  const blockedIds = new Set(await getBlockedUserIds(currentUserId));

  const entries = await Promise.all(
    users
      .map((user) => toPublicMember(user))
      .filter((user) => user.id !== currentUserId)
      .map(async (user) => {
        if (blockedIds.has(user.id)) return null;
        if (await hasMessagingBlock(currentUserId, user.id)) return null;
        return {
          id: user.id,
          name: user.name,
          campusId: user.campusId,
        } satisfies MemberDirectoryEntry;
      }),
  );

  return entries
    .filter((entry): entry is MemberDirectoryEntry => entry !== null)
    .sort((a, b) => a.name.localeCompare(b.name));
}

export async function getThreadsForUser(userId: string) {
  const threads = await readJson<MessageThread[]>(THREADS_FILE, []);
  const filtered = [];

  for (const thread of threads) {
    if (!thread.participantIds.includes(userId)) continue;
    const otherId = thread.participantIds.find((id) => id !== userId);
    if (otherId && (await hasMessagingBlock(userId, otherId))) continue;
    filtered.push(thread);
  }

  return filtered.sort(
    (a, b) =>
      new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime(),
  );
}

export async function getMessagesForThread(threadId: string, userId: string) {
  const threads = await readJson<MessageThread[]>(THREADS_FILE, []);
  const thread = threads.find((item) => item.id === threadId);
  if (!thread || !thread.participantIds.includes(userId)) {
    return null;
  }

  const otherId = thread.participantIds.find((id) => id !== userId);
  if (otherId && (await hasMessagingBlock(userId, otherId))) {
    return null;
  }

  const messages = await readJson<DirectMessage[]>(MESSAGES_FILE, []);
  const threadMessages = messages
    .filter((message) => message.threadId === threadId)
    .map(mapMessage)
    .sort(
      (a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    );

  await markThreadRead(threadId, userId);

  const refreshed = await readJson<DirectMessage[]>(MESSAGES_FILE, []);
  return {
    thread,
    messages: refreshed
      .filter((message) => message.threadId === threadId)
      .map(mapMessage)
      .sort(
        (a, b) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
      ),
  };
}

export async function markThreadRead(threadId: string, userId: string) {
  const threads = await readJson<MessageThread[]>(THREADS_FILE, []);
  const thread = threads.find((item) => item.id === threadId);
  if (!thread || !thread.participantIds.includes(userId)) return;

  const messages = await readJson<DirectMessage[]>(MESSAGES_FILE, []);
  const now = new Date().toISOString();
  let changed = false;

  for (let index = 0; index < messages.length; index += 1) {
    const message = messages[index];
    if (message.threadId !== threadId) continue;
    if (message.senderId === userId) continue;
    if (message.readAt) continue;
    messages[index] = { ...message, readAt: now };
    changed = true;
  }

  if (changed) {
    await writeJson(MESSAGES_FILE, messages);
  }
}

export async function sendDirectMessage(input: {
  senderId: string;
  senderName: string;
  recipientId: string;
  recipientName: string;
  content: string;
  threadId?: string;
  attachmentUrl?: string;
  attachmentType?: string;
  attachmentName?: string;
}) {
  const content = validateChatContent(input.content, Boolean(input.attachmentUrl));

  const blockReason = await getMessagingBlockReason(
    input.senderId,
    input.recipientId,
  );
  if (blockReason) {
    throw new Error(blockReason);
  }

  const threads = await readJson<MessageThread[]>(THREADS_FILE, []);
  const messages = await readJson<DirectMessage[]>(MESSAGES_FILE, []);
  const now = new Date().toISOString();
  const threadId =
    input.threadId ?? buildThreadId(input.senderId, input.recipientId);

  let thread = threads.find((item) => item.id === threadId);
  const message: DirectMessage = {
    id: `msg-${Date.now()}`,
    threadId,
    senderId: input.senderId,
    senderName: input.senderName,
    content,
    reactions: [],
    attachmentUrl: input.attachmentUrl,
    attachmentType: input.attachmentType,
    attachmentName: input.attachmentName,
    createdAt: now,
  };

  if (!thread) {
    const participantIds = threadKey(input.senderId, input.recipientId);
    thread = {
      id: threadId,
      participantIds,
      participantNames: {
        [input.senderId]: input.senderName,
        [input.recipientId]: input.recipientName,
      },
      lastMessage: previewForMessage(message),
      lastMessageAt: now,
      createdAt: now,
    };
    threads.unshift(thread);
  } else {
    thread.lastMessage = previewForMessage(message);
    thread.lastMessageAt = now;
    thread.participantNames[input.senderId] = input.senderName;
    thread.participantNames[input.recipientId] = input.recipientName;
  }

  messages.push(message);
  await writeJson(THREADS_FILE, threads);
  await writeJson(MESSAGES_FILE, messages);

  return { thread, message };
}

export async function editDirectMessage(input: {
  threadId: string;
  messageId: string;
  userId: string;
  content: string;
}) {
  const content = validateChatContent(input.content, false);
  const threads = await readJson<MessageThread[]>(THREADS_FILE, []);
  const thread = threads.find((entry) => entry.id === input.threadId);
  if (!thread || !thread.participantIds.includes(input.userId)) return null;

  const messages = await readJson<DirectMessage[]>(MESSAGES_FILE, []);
  const index = messages.findIndex(
    (message) => message.id === input.messageId && message.threadId === input.threadId,
  );
  if (index === -1) return null;

  const message = messages[index];
  if (message.senderId !== input.userId) {
    throw new Error("You can only edit your own messages.");
  }
  if (message.deletedAt) {
    throw new Error("Deleted messages cannot be edited.");
  }

  const updated = { ...message, content, editedAt: new Date().toISOString() };
  messages[index] = updated;

  const latest = [...messages]
    .filter((entry) => entry.threadId === input.threadId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
  if (latest?.id === updated.id) {
    thread.lastMessage = previewForMessage(updated);
  }

  await writeJson(MESSAGES_FILE, messages);
  await writeJson(THREADS_FILE, threads);
  return mapMessage(updated);
}

export async function deleteDirectMessage(input: {
  threadId: string;
  messageId: string;
  userId: string;
}) {
  const threads = await readJson<MessageThread[]>(THREADS_FILE, []);
  const thread = threads.find((entry) => entry.id === input.threadId);
  if (!thread || !thread.participantIds.includes(input.userId)) return null;

  const messages = await readJson<DirectMessage[]>(MESSAGES_FILE, []);
  const index = messages.findIndex(
    (message) => message.id === input.messageId && message.threadId === input.threadId,
  );
  if (index === -1) return null;

  const message = messages[index];
  if (message.senderId !== input.userId) {
    throw new Error("You can only delete your own messages.");
  }

  const updated = {
    ...message,
    content: "",
    deletedAt: new Date().toISOString(),
  };
  messages[index] = updated;

  const latest = [...messages]
    .filter((entry) => entry.threadId === input.threadId && !entry.deletedAt)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
  thread.lastMessage = latest ? previewForMessage(latest) : "Message deleted";

  await writeJson(MESSAGES_FILE, messages);
  await writeJson(THREADS_FILE, threads);
  return mapMessage(updated);
}

export async function toggleDirectMessageReaction(input: {
  threadId: string;
  messageId: string;
  userId: string;
  userName: string;
  emoji: string;
}) {
  const threads = await readJson<MessageThread[]>(THREADS_FILE, []);
  const thread = threads.find((entry) => entry.id === input.threadId);
  if (!thread || !thread.participantIds.includes(input.userId)) return null;

  const messages = await readJson<DirectMessage[]>(MESSAGES_FILE, []);
  const index = messages.findIndex(
    (message) => message.id === input.messageId && message.threadId === input.threadId,
  );
  if (index === -1) return null;

  const reactions = toggleChatReaction(messages[index].reactions, input.emoji, {
    id: input.userId,
    name: input.userName,
  });
  const updated = { ...messages[index], reactions };
  messages[index] = updated;
  await writeJson(MESSAGES_FILE, messages);
  return mapMessage(updated);
}

export function getOtherParticipant(thread: MessageThread, userId: string) {
  const otherId = thread.participantIds.find((id) => id !== userId);
  if (!otherId) return "Member";
  return thread.participantNames[otherId] ?? "Member";
}

export function getOtherParticipantId(thread: MessageThread, userId: string) {
  return thread.participantIds.find((id) => id !== userId) ?? null;
}

export async function getUnreadDirectMessageSummary(userId: string) {
  const threads = await getThreadsForUser(userId);
  if (threads.length === 0) return [];

  const messages = await readJson<DirectMessage[]>(MESSAGES_FILE, []);
  const unread = messages.filter(
    (message) =>
      message.senderId !== userId &&
      !message.readAt &&
      threads.some((thread) => thread.id === message.threadId),
  );

  const byThread = new Map<string, DirectMessage[]>();
  for (const message of unread) {
    const bucket = byThread.get(message.threadId) ?? [];
    bucket.push(message);
    byThread.set(message.threadId, bucket);
  }

  const items = [];
  for (const thread of threads) {
    const threadMessages = byThread.get(thread.id);
    if (!threadMessages?.length) continue;
    const sorted = [...threadMessages].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
    const latest = sorted[0];
    items.push({
      id: `dm-${thread.id}`,
      type: "direct_message" as const,
      title: getOtherParticipant(thread, userId),
      body: previewForMessage(mapMessage(latest)),
      href: `/messages?thread=${encodeURIComponent(thread.id)}`,
      count: threadMessages.length,
      at: latest.createdAt,
    });
  }

  return items.sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());
}
