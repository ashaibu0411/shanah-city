import { prisma } from "@/lib/db";
import type { GroupChatMessage } from "@/lib/group-types";

const MAX_MESSAGES_PER_GROUP = 500;

function mapMessage(record: {
  id: string;
  groupId: string;
  groupName: string;
  senderId: string;
  senderName: string;
  content: string;
  createdAt: Date;
}): GroupChatMessage {
  return {
    id: record.id,
    groupId: record.groupId,
    groupName: record.groupName,
    senderId: record.senderId,
    senderName: record.senderName,
    content: record.content,
    createdAt: record.createdAt.toISOString(),
  };
}

export async function listGroupChatMessages(groupId: string, options?: { after?: string }) {
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

  return records.map(mapMessage);
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

  const message = await prisma.groupChatMessage.create({
    data: {
      id: `group-msg-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      groupId: input.groupId,
      groupName: input.groupName,
      senderId: input.senderId,
      senderName: input.senderName,
      content,
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

  return mapMessage(message);
}

export async function deleteGroupChatMessagesForGroup(groupId: string) {
  await prisma.groupChatMessage.deleteMany({ where: { groupId } });
}
