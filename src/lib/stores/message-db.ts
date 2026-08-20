import { getUsers, toPublicMember } from "@/lib/auth-server";
import {
  getBlockedUserIds,
  hasMessagingBlock,
  getMessagingBlockReason,
} from "@/lib/block-server";
import { normalizeChatReactions, toggleChatReaction, validateChatContent } from "@/lib/chat-utils";
import { prisma } from "@/lib/db";
import type {
  DirectMessage,
  MemberDirectoryEntry,
  MessageThread,
} from "@/lib/member-types";

function threadKey(userA: string, userB: string): [string, string] {
  return userA < userB ? [userA, userB] : [userB, userA];
}

function buildThreadId(userA: string, userB: string) {
  const [first, second] = threadKey(userA, userB);
  return `thread-${first}-${second}`;
}

function mapThread(record: {
  id: string;
  participantAId: string;
  participantBId: string;
  participantNames: unknown;
  lastMessage: string;
  lastMessageAt: Date;
  createdAt: Date;
}): MessageThread {
  return {
    id: record.id,
    participantIds: [record.participantAId, record.participantBId],
    participantNames: record.participantNames as Record<string, string>,
    lastMessage: record.lastMessage,
    lastMessageAt: record.lastMessageAt.toISOString(),
    createdAt: record.createdAt.toISOString(),
  };
}

function mapMessage(record: {
  id: string;
  threadId: string;
  senderId: string;
  senderName: string;
  content: string;
  reactions?: unknown;
  attachmentUrl: string | null;
  attachmentType: string | null;
  attachmentName: string | null;
  editedAt: Date | null;
  deletedAt: Date | null;
  createdAt: Date;
  readAt: Date | null;
}): DirectMessage {
  return {
    id: record.id,
    threadId: record.threadId,
    senderId: record.senderId,
    senderName: record.senderName,
    content: record.content,
    reactions: normalizeChatReactions(
      Array.isArray(record.reactions) ? (record.reactions as DirectMessage["reactions"]) : [],
    ),
    ...(record.attachmentUrl ? { attachmentUrl: record.attachmentUrl } : {}),
    ...(record.attachmentType ? { attachmentType: record.attachmentType } : {}),
    ...(record.attachmentName ? { attachmentName: record.attachmentName } : {}),
    ...(record.editedAt ? { editedAt: record.editedAt.toISOString() } : {}),
    ...(record.deletedAt ? { deletedAt: record.deletedAt.toISOString() } : {}),
    createdAt: record.createdAt.toISOString(),
    ...(record.readAt ? { readAt: record.readAt.toISOString() } : {}),
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
  const records = await prisma.messageThread.findMany({
    where: {
      OR: [{ participantAId: userId }, { participantBId: userId }],
    },
  });

  const filtered = [];
  for (const record of records) {
    const thread = mapThread(record);
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
  const record = await prisma.messageThread.findUnique({
    where: { id: threadId },
  });
  if (!record) return null;

  const thread = mapThread(record);
  if (!thread.participantIds.includes(userId)) return null;

  const otherId = thread.participantIds.find((id) => id !== userId);
  if (otherId && (await hasMessagingBlock(userId, otherId))) return null;

  await markThreadRead(threadId, userId);

  const messageRecords = await prisma.message.findMany({
    where: { threadId },
    orderBy: { createdAt: "asc" },
  });

  return {
    thread,
    messages: messageRecords.map(mapMessage),
  };
}

export async function markThreadRead(threadId: string, userId: string) {
  const record = await prisma.messageThread.findUnique({ where: { id: threadId } });
  if (!record) return;
  const participantIds = [record.participantAId, record.participantBId];
  if (!participantIds.includes(userId)) return;

  await prisma.message.updateMany({
    where: {
      threadId,
      senderId: { not: userId },
      readAt: null,
    },
    data: { readAt: new Date() },
  });
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

  const now = new Date();
  const threadId =
    input.threadId ?? buildThreadId(input.senderId, input.recipientId);
  const [participantAId, participantBId] = threadKey(
    input.senderId,
    input.recipientId,
  );

  const participantNames = {
    [input.senderId]: input.senderName,
    [input.recipientId]: input.recipientName,
  };

  const existingThread = await prisma.messageThread.findUnique({
    where: { id: threadId },
  });

  if (!existingThread) {
    await prisma.messageThread.create({
      data: {
        id: threadId,
        participantAId,
        participantBId,
        participantNames,
        lastMessage: "",
        lastMessageAt: now,
        createdAt: now,
      },
    });
  }

  const messageRecord = await prisma.message.create({
    data: {
      id: `msg-${Date.now()}`,
      threadId,
      senderId: input.senderId,
      senderName: input.senderName,
      content,
      attachmentUrl: input.attachmentUrl,
      attachmentType: input.attachmentType,
      attachmentName: input.attachmentName,
      createdAt: now,
    },
  });

  const message = mapMessage(messageRecord);
  const updatedNames = existingThread
    ? {
        ...(existingThread.participantNames as Record<string, string>),
        ...participantNames,
      }
    : participantNames;

  const updated = await prisma.messageThread.update({
    where: { id: threadId },
    data: {
      lastMessage: previewForMessage(message),
      lastMessageAt: now,
      participantNames: updatedNames,
    },
  });

  return { thread: mapThread(updated), message };
}

export async function editDirectMessage(input: {
  threadId: string;
  messageId: string;
  userId: string;
  content: string;
}) {
  const content = validateChatContent(input.content, false);
  const thread = await prisma.messageThread.findUnique({ where: { id: input.threadId } });
  if (!thread) return null;
  const participantIds = [thread.participantAId, thread.participantBId];
  if (!participantIds.includes(input.userId)) return null;

  const message = await prisma.message.findFirst({
    where: { id: input.messageId, threadId: input.threadId },
  });
  if (!message) return null;
  if (message.senderId !== input.userId) {
    throw new Error("You can only edit your own messages.");
  }
  if (message.deletedAt) {
    throw new Error("Deleted messages cannot be edited.");
  }

  const updated = await prisma.message.update({
    where: { id: message.id },
    data: { content, editedAt: new Date() },
  });

  const mapped = mapMessage(updated);
  const latest = await prisma.message.findFirst({
    where: { threadId: input.threadId, deletedAt: null },
    orderBy: { createdAt: "desc" },
  });
  if (latest?.id === updated.id) {
    await prisma.messageThread.update({
      where: { id: input.threadId },
      data: { lastMessage: previewForMessage(mapped) },
    });
  }

  return mapped;
}

export async function deleteDirectMessage(input: {
  threadId: string;
  messageId: string;
  userId: string;
}) {
  const thread = await prisma.messageThread.findUnique({ where: { id: input.threadId } });
  if (!thread) return null;
  const participantIds = [thread.participantAId, thread.participantBId];
  if (!participantIds.includes(input.userId)) return null;

  const message = await prisma.message.findFirst({
    where: { id: input.messageId, threadId: input.threadId },
  });
  if (!message) return null;
  if (message.senderId !== input.userId) {
    throw new Error("You can only delete your own messages.");
  }

  const updated = await prisma.message.update({
    where: { id: message.id },
    data: { content: "", deletedAt: new Date() },
  });

  const latest = await prisma.message.findFirst({
    where: { threadId: input.threadId, deletedAt: null },
    orderBy: { createdAt: "desc" },
  });

  await prisma.messageThread.update({
    where: { id: input.threadId },
    data: { lastMessage: latest ? previewForMessage(mapMessage(latest)) : "Message deleted" },
  });

  return mapMessage(updated);
}

export async function toggleDirectMessageReaction(input: {
  threadId: string;
  messageId: string;
  userId: string;
  userName: string;
  emoji: string;
}) {
  const thread = await prisma.messageThread.findUnique({ where: { id: input.threadId } });
  if (!thread) return null;
  const participantIds = [thread.participantAId, thread.participantBId];
  if (!participantIds.includes(input.userId)) return null;

  const message = await prisma.message.findFirst({
    where: { id: input.messageId, threadId: input.threadId },
  });
  if (!message) return null;

  const reactions = toggleChatReaction(
    normalizeChatReactions(Array.isArray(message.reactions) ? (message.reactions as DirectMessage["reactions"]) : []),
    input.emoji,
    { id: input.userId, name: input.userName },
  );

  const updated = await prisma.message.update({
    where: { id: message.id },
    data: { reactions },
  });

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

  const threadIds = threads.map((thread) => thread.id);
  const unreadMessages = await prisma.message.findMany({
    where: {
      threadId: { in: threadIds },
      senderId: { not: userId },
      readAt: null,
    },
    orderBy: { createdAt: "desc" },
  });

  const byThread = new Map<string, typeof unreadMessages>();
  for (const message of unreadMessages) {
    const bucket = byThread.get(message.threadId) ?? [];
    bucket.push(message);
    byThread.set(message.threadId, bucket);
  }

  const items = [];
  for (const thread of threads) {
    const messages = byThread.get(thread.id);
    if (!messages?.length) continue;
    const latest = messages[0];
    items.push({
      id: `dm-${thread.id}`,
      type: "direct_message" as const,
      title: getOtherParticipant(thread, userId),
      body: previewForMessage(mapMessage(latest)),
      href: `/messages?thread=${encodeURIComponent(thread.id)}`,
      count: messages.length,
      at: latest.createdAt.toISOString(),
    });
  }

  return items.sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());
}
