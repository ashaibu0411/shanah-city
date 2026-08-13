import { promises as fs } from "fs";
import path from "path";
import { getUsers, toPublicMember } from "@/lib/auth-server";
import {
  getBlockedUserIds,
  hasMessagingBlock,
  getMessagingBlockReason,
} from "@/lib/block-server";
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
  return {
    thread,
    messages: messages
      .filter((message) => message.threadId === threadId)
      .sort(
        (a, b) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
      ),
  };
}

export async function sendDirectMessage(input: {
  senderId: string;
  senderName: string;
  recipientId: string;
  recipientName: string;
  content: string;
  threadId?: string;
}) {
  const content = input.content.trim();
  if (!content) {
    throw new Error("Message cannot be empty.");
  }

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
  if (!thread) {
    const participantIds = threadKey(input.senderId, input.recipientId);
    thread = {
      id: threadId,
      participantIds,
      participantNames: {
        [input.senderId]: input.senderName,
        [input.recipientId]: input.recipientName,
      },
      lastMessage: content,
      lastMessageAt: now,
      createdAt: now,
    };
    threads.unshift(thread);
  } else {
    thread.lastMessage = content;
    thread.lastMessageAt = now;
    thread.participantNames[input.senderId] = input.senderName;
    thread.participantNames[input.recipientId] = input.recipientName;
  }

  const message: DirectMessage = {
    id: `msg-${Date.now()}`,
    threadId,
    senderId: input.senderId,
    senderName: input.senderName,
    content,
    createdAt: now,
  };

  messages.push(message);
  await writeJson(THREADS_FILE, threads);
  await writeJson(MESSAGES_FILE, messages);

  return { thread, message };
}

export function getOtherParticipant(thread: MessageThread, userId: string) {
  const otherId = thread.participantIds.find((id) => id !== userId);
  if (!otherId) return "Member";
  return thread.participantNames[otherId] ?? "Member";
}

export function getOtherParticipantId(thread: MessageThread, userId: string) {
  return thread.participantIds.find((id) => id !== userId) ?? null;
}
