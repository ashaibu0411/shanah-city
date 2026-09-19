import { getUsers, toPublicMember } from "@/lib/auth-server";
import {
  getBlockedUserIds,
  hasMessagingBlock,
  getMessagingBlockReason,
} from "@/lib/block-server";
import { normalizeChatReactions, toggleChatReaction, validateChatContent } from "@/lib/chat-utils";
import { buildChatMessageReply } from "@/lib/chat-reply-utils";
import { replyFromStoredRecord, replyToDbFields } from "@/lib/chat-reply-server";
import { prisma } from "@/lib/db";
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
  normalizeThreadParticipantIds,
  threadKey,
} from "@/lib/message-thread-utils";

function mapThread(record: {
  id: string;
  participantAId: string;
  participantBId: string;
  participantNames: unknown;
  participantIds?: unknown;
  isGroup?: boolean;
  lastMessage: string;
  lastMessageAt: Date;
  createdAt: Date;
}): MessageThread {
  const participantIds = normalizeThreadParticipantIds(record);
  return {
    id: record.id,
    participantIds,
    participantNames: record.participantNames as Record<string, string>,
    isGroup: record.isGroup ?? participantIds.length > 2,
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
  replyToMessageId: string | null;
  replyToSenderId: string | null;
  replyToSenderName: string | null;
  replyToExcerpt: string | null;
  createdAt: Date;
  readAt: Date | null;
}): DirectMessage {
  const reply = replyFromStoredRecord(record);
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
    ...(reply ? { reply } : {}),
    createdAt: record.createdAt.toISOString(),
    ...(record.readAt ? { readAt: record.readAt.toISOString() } : {}),
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
  const records = await prisma.messageThread.findMany();
  const filtered = [];

  for (const record of records) {
    const participantIds = normalizeThreadParticipantIds(record);
    if (!participantIds.includes(userId)) continue;

    const others = participantIds.filter((id) => id !== userId);
    let skip = false;
    for (const otherId of others) {
      if (await hasMessagingBlock(userId, otherId)) {
        skip = true;
        break;
      }
    }
    if (skip) continue;

    filtered.push(mapThread(record));
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

  const otherIds = thread.participantIds.filter((id) => id !== userId);
  for (const otherId of otherIds) {
    if (await hasMessagingBlock(userId, otherId)) return null;
  }

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
  const participantIds = normalizeThreadParticipantIds(record);
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

  const now = new Date();
  let threadId = input.threadId;
  let allParticipantIds: string[] = [];
  let isGroup = false;

  if (threadId) {
    const existing = await prisma.messageThread.findUnique({ where: { id: threadId } });
    if (!existing) {
      throw new Error("Conversation not found.");
    }
    allParticipantIds = normalizeThreadParticipantIds(existing);
    isGroup = existing.isGroup ?? allParticipantIds.length > 2;
  } else {
    allParticipantIds = [...new Set([input.senderId, ...recipientIds])].sort();
    isGroup = allParticipantIds.length > 2;
    threadId = isGroup
      ? buildGroupThreadId(allParticipantIds)
      : buildDirectThreadId(input.senderId, recipientIds[0]!);
  }

  const [participantAId, participantBId] = threadKey(
    allParticipantIds[0]!,
    allParticipantIds[1] ?? allParticipantIds[0]!,
  );

  const participantNames: Record<string, string> = {
    [input.senderId]: input.senderName,
  };
  for (const recipientId of recipientIds) {
    participantNames[recipientId] =
      input.recipientNames?.[recipientId] ??
      (recipientId === singleRecipientId ? input.recipientName : undefined) ??
      "Member";
  }

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
        participantIds: allParticipantIds,
        isGroup,
        lastMessage: "",
        lastMessageAt: now,
        createdAt: now,
      },
    });
  }

  let replyFields = replyToDbFields(undefined);
  const replyToMessageId = String(input.replyToMessageId ?? "").trim();
  if (replyToMessageId) {
    const target = await prisma.message.findFirst({
      where: { id: replyToMessageId, threadId },
    });
    if (!target) {
      throw new Error("The message you are replying to was not found.");
    }
    const reply = buildChatMessageReply({
      messageId: target.id,
      senderId: target.senderId,
      senderName: target.senderName,
      content: target.content,
      deletedAt: target.deletedAt?.toISOString() ?? null,
      attachmentName: target.attachmentName,
      attachmentUrl: target.attachmentUrl,
      excerptOverride: input.replyExcerpt,
    });
    replyFields = replyToDbFields(reply);
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
      ...replyFields,
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
      participantIds: allParticipantIds,
      isGroup,
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
  const participantIds = normalizeThreadParticipantIds(thread);
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
  const participantIds = normalizeThreadParticipantIds(thread);
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
  const participantIds = normalizeThreadParticipantIds(thread);
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
  return getThreadDisplayName(thread, userId);
}

export function getOtherParticipantId(thread: MessageThread, userId: string) {
  return getPrimaryOtherParticipantId(thread, userId);
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
