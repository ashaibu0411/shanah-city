import { promises as fs } from "fs";
import path from "path";
import { getUsers, toPublicMember } from "@/lib/auth-server";
import {
  getBlockedUserIds,
  hasMessagingBlock,
  getMessagingBlockReason,
} from "@/lib/block-server";
import { normalizeChatReactions, toggleChatReaction, validateChatContent } from "@/lib/chat-utils";
import { buildChatMessageReply } from "@/lib/chat-reply-utils";
import { getPublicDisplayName } from "@/lib/member-display-name";
import type {
  DirectMessage,
  MemberDirectoryEntry,
  MessageThread,
} from "@/lib/member-types";
import {
  buildDirectThreadId,
  buildGroupThreadId,
  getPrimaryOtherParticipantId,
  getThreadDisplayName,
  threadKey,
} from "@/lib/message-thread-utils";

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

function buildThreadId(userA: string, userB: string) {
  return buildDirectThreadId(userA, userB);
}

function mapMessage(message: DirectMessage): DirectMessage {
  return {
    ...message,
    reactions: normalizeChatReactions(message.reactions),
  };
}

function previewForMessage(message: DirectMessage) {
  if (message.deletedAt) return "Message deleted";
  if (message.reply) return `↩ ${message.content.slice(0, 100) || "Reply"}`;
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
          name: getPublicDisplayName(user),
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
    const others = thread.participantIds.filter((id) => id !== userId);
    let skip = false;
    for (const otherId of others) {
      if (await hasMessagingBlock(userId, otherId)) {
        skip = true;
        break;
      }
    }
    if (skip) continue;
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

  const others = thread.participantIds.filter((id) => id !== userId);
  for (const otherId of others) {
    if (await hasMessagingBlock(userId, otherId)) {
      return null;
    }
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
  recipientId?: string;
  recipientName?: string;
  recipientIds?: string[];
  recipientNames?: Record<string, string>;
  content: string;
  threadId?: string;
  attachmentUrl?: string;
  attachmentType?: string;
  attachmentName?: string;
  replyToMessageId?: string;
  replyExcerpt?: string;
}) {
  const content = validateChatContent(input.content, Boolean(input.attachmentUrl));

  const explicitRecipients = (input.recipientIds ?? [])
    .map((id) => id.trim())
    .filter((id) => id && id !== input.senderId);
  const singleRecipientId = String(input.recipientId ?? "").trim();
  const recipientIds =
    explicitRecipients.length > 0
      ? explicitRecipients
      : singleRecipientId
        ? [singleRecipientId]
        : [];

  if (recipientIds.length === 0 && !input.threadId) {
    throw new Error("Choose at least one member to message.");
  }

  for (const recipientId of recipientIds) {
    const blockReason = await getMessagingBlockReason(input.senderId, recipientId);
    if (blockReason) {
      throw new Error(blockReason);
    }
  }

  const threads = await readJson<MessageThread[]>(THREADS_FILE, []);
  const messages = await readJson<DirectMessage[]>(MESSAGES_FILE, []);
  const now = new Date().toISOString();

  let threadId = input.threadId;
  let allParticipantIds: string[] = [];
  let isGroup = false;

  if (threadId) {
    const existing = threads.find((item) => item.id === threadId);
    if (!existing) {
      throw new Error("Conversation not found.");
    }
    allParticipantIds = existing.participantIds;
    isGroup = existing.isGroup ?? allParticipantIds.length > 2;
  } else {
    allParticipantIds = [...new Set([input.senderId, ...recipientIds])].sort();
    isGroup = allParticipantIds.length > 2;
    threadId = isGroup
      ? buildGroupThreadId(allParticipantIds)
      : buildDirectThreadId(input.senderId, recipientIds[0]!);
  }

  let thread = threads.find((item) => item.id === threadId);
  let reply: DirectMessage["reply"];
  const replyToMessageId = String(input.replyToMessageId ?? "").trim();
  if (replyToMessageId) {
    const target = messages.find(
      (entry) => entry.id === replyToMessageId && entry.threadId === threadId,
    );
    if (!target) {
      throw new Error("The message you are replying to was not found.");
    }
    reply = buildChatMessageReply({
      messageId: target.id,
      senderId: target.senderId,
      senderName: target.senderName,
      content: target.content,
      deletedAt: target.deletedAt ?? null,
      attachmentName: target.attachmentName ?? null,
      attachmentUrl: target.attachmentUrl ?? null,
      excerptOverride: input.replyExcerpt,
    });
  }

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
    ...(reply ? { reply } : {}),
    createdAt: now,
  };

  const participantNames: Record<string, string> = {
    [input.senderId]: input.senderName,
  };
  for (const recipientId of recipientIds) {
    participantNames[recipientId] =
      input.recipientNames?.[recipientId] ??
      (recipientId === singleRecipientId ? input.recipientName : undefined) ??
      "Member";
  }

  if (!thread) {
    thread = {
      id: threadId!,
      participantIds: allParticipantIds,
      participantNames,
      isGroup,
      lastMessage: previewForMessage(message),
      lastMessageAt: now,
      createdAt: now,
    };
    threads.unshift(thread);
  } else {
    thread.lastMessage = previewForMessage(message);
    thread.lastMessageAt = now;
    thread.participantNames = { ...thread.participantNames, ...participantNames };
    thread.participantIds = allParticipantIds;
    thread.isGroup = isGroup;
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
  return getThreadDisplayName(thread, userId);
}

export function getOtherParticipantId(thread: MessageThread, userId: string) {
  return getPrimaryOtherParticipantId(thread, userId);
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
