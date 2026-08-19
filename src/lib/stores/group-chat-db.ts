import { prisma } from "@/lib/db";
import type { GroupChatMessage } from "@/lib/group-types";
import { normalizeChatReactions, toggleChatReaction, validateChatContent } from "@/lib/chat-utils";

const MAX_MESSAGES_PER_GROUP = 500;

function parseReactions(value: unknown) {
  return normalizeChatReactions(Array.isArray(value) ? (value as GroupChatMessage["reactions"]) : []);
}

function mapMessage(record: {
  id: string;
  groupId: string;
  groupName: string;
  senderId: string;
  senderName: string;
  content: string;
  reactions: unknown;
  attachmentUrl: string | null;
  attachmentType: string | null;
  attachmentName: string | null;
  editedAt: Date | null;
  deletedAt: Date | null;
  createdAt: Date;
}): GroupChatMessage {
  return {
    id: record.id,
    groupId: record.groupId,
    groupName: record.groupName,
    senderId: record.senderId,
    senderName: record.senderName,
    content: record.content,
    reactions: parseReactions(record.reactions),
    ...(record.attachmentUrl ? { attachmentUrl: record.attachmentUrl } : {}),
    ...(record.attachmentType ? { attachmentType: record.attachmentType } : {}),
    ...(record.attachmentName ? { attachmentName: record.attachmentName } : {}),
    ...(record.editedAt ? { editedAt: record.editedAt.toISOString() } : {}),
    ...(record.deletedAt ? { deletedAt: record.deletedAt.toISOString() } : {}),
    createdAt: record.createdAt.toISOString(),
  };
}

async function computeSeenCount(
  message: GroupChatMessage,
  groupId: string,
  memberIds: string[],
) {
  const messageTime = new Date(message.createdAt);
  const states = await prisma.groupChatReadState.findMany({ where: { groupId } });
  return states.filter((state) => {
    if (state.userId === message.senderId) return false;
    if (!memberIds.includes(state.userId)) return false;
    return state.lastReadAt >= messageTime;
  }).length;
}

export async function listGroupChatMessages(
  groupId: string,
  options?: { after?: string; viewerId?: string; memberIds?: string[] },
) {
  const where: {
    groupId: string;
    createdAt?: { gt: Date };
  } = { groupId };

  if (options?.after) {
    const afterDate = new Date(options.after);
    if (!Number.isNaN(afterDate.getTime())) {
      where.createdAt = { gt: afterDate };
    }
  }

  const records = await prisma.groupChatMessage.findMany({
    where,
    orderBy: { createdAt: "asc" },
    take: 100,
  });

  const messages = records.map(mapMessage);
  const memberIds = options?.memberIds ?? [];

  if (!options?.viewerId || memberIds.length === 0) {
    return messages;
  }

  return Promise.all(
    messages.map(async (message) => {
      if (message.senderId !== options.viewerId) return message;
      return {
        ...message,
        seenCount: await computeSeenCount(message, groupId, memberIds),
      };
    }),
  );
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

  const message = await prisma.groupChatMessage.create({
    data: {
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
      createdAt: new Date(),
    },
  });

  const overflow = await prisma.groupChatMessage.findMany({
    where: { groupId: input.groupId },
    orderBy: { createdAt: "desc" },
    skip: MAX_MESSAGES_PER_GROUP,
    select: { id: true },
  });

  if (overflow.length > 0) {
    await prisma.groupChatMessage.deleteMany({
      where: { id: { in: overflow.map((entry) => entry.id) } },
    });
  }

  await markGroupChatRead(input.groupId, input.senderId);
  return mapMessage(message);
}

export async function editGroupChatMessage(input: {
  groupId: string;
  messageId: string;
  userId: string;
  content: string;
}) {
  const content = validateChatContent(input.content, false);
  const existing = await prisma.groupChatMessage.findFirst({
    where: { id: input.messageId, groupId: input.groupId },
  });
  if (!existing) return null;
  if (existing.senderId !== input.userId) {
    throw new Error("You can only edit your own messages.");
  }
  if (existing.deletedAt) {
    throw new Error("Deleted messages cannot be edited.");
  }

  const updated = await prisma.groupChatMessage.update({
    where: { id: existing.id },
    data: { content, editedAt: new Date() },
  });
  return mapMessage(updated);
}

export async function deleteGroupChatMessage(input: {
  groupId: string;
  messageId: string;
  userId: string;
  isGroupAdmin?: boolean;
}) {
  const existing = await prisma.groupChatMessage.findFirst({
    where: { id: input.messageId, groupId: input.groupId },
  });
  if (!existing) return null;
  if (existing.senderId !== input.userId && !input.isGroupAdmin) {
    throw new Error("You can only delete your own messages.");
  }

  const updated = await prisma.groupChatMessage.update({
    where: { id: existing.id },
    data: { content: "", deletedAt: new Date() },
  });
  return mapMessage(updated);
}

export async function markGroupChatRead(groupId: string, userId: string) {
  const id = `read-${groupId}-${userId}`;
  await prisma.groupChatReadState.upsert({
    where: { groupId_userId: { groupId, userId } },
    create: { id, groupId, userId, lastReadAt: new Date() },
    update: { lastReadAt: new Date() },
  });
}

export async function deleteGroupChatMessagesForGroup(groupId: string) {
  await prisma.groupChatMessage.deleteMany({ where: { groupId } });
  await prisma.groupChatReadState.deleteMany({ where: { groupId } });
}

export async function toggleGroupChatReaction(input: {
  groupId: string;
  messageId: string;
  emoji: string;
  userId: string;
  userName: string;
}) {
  const existing = await prisma.groupChatMessage.findFirst({
    where: { id: input.messageId, groupId: input.groupId },
  });
  if (!existing) return null;

  const reactions = toggleChatReaction(parseReactions(existing.reactions), input.emoji, {
    id: input.userId,
    name: input.userName,
  });

  const updated = await prisma.groupChatMessage.update({
    where: { id: existing.id },
    data: { reactions },
  });

  return mapMessage(updated);
}
