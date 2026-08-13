import { getUsers, toPublicMember } from "@/lib/auth-server";
import {
  getBlockedUserIds,
  hasMessagingBlock,
  getMessagingBlockReason,
} from "@/lib/block-server";
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
  createdAt: Date;
  readAt: Date | null;
}): DirectMessage {
  return {
    id: record.id,
    threadId: record.threadId,
    senderId: record.senderId,
    senderName: record.senderName,
    content: record.content,
    createdAt: record.createdAt.toISOString(),
    ...(record.readAt ? { readAt: record.readAt.toISOString() } : {}),
  };
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

  const messageRecords = await prisma.message.findMany({
    where: { threadId },
    orderBy: { createdAt: "asc" },
  });

  return {
    thread,
    messages: messageRecords.map(mapMessage),
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

  let thread: MessageThread;
  if (!existingThread) {
    const created = await prisma.messageThread.create({
      data: {
        id: threadId,
        participantAId,
        participantBId,
        participantNames,
        lastMessage: content,
        lastMessageAt: now,
        createdAt: now,
      },
    });
    thread = mapThread(created);
  } else {
    const updatedNames = {
      ...(existingThread.participantNames as Record<string, string>),
      ...participantNames,
    };
    const updated = await prisma.messageThread.update({
      where: { id: threadId },
      data: {
        lastMessage: content,
        lastMessageAt: now,
        participantNames: updatedNames,
      },
    });
    thread = mapThread(updated);
  }

  const messageRecord = await prisma.message.create({
    data: {
      id: `msg-${Date.now()}`,
      threadId,
      senderId: input.senderId,
      senderName: input.senderName,
      content,
      createdAt: now,
    },
  });

  return { thread, message: mapMessage(messageRecord) };
}

export function getOtherParticipant(thread: MessageThread, userId: string) {
  const otherId = thread.participantIds.find((id) => id !== userId);
  if (!otherId) return "Member";
  return thread.participantNames[otherId] ?? "Member";
}

export function getOtherParticipantId(thread: MessageThread, userId: string) {
  return thread.participantIds.find((id) => id !== userId) ?? null;
}
