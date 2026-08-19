import type { MessageReport, UserBlock } from "@/lib/block-types";
import { prisma } from "@/lib/db";

function mapBlock(record: {
  id: string;
  blockerId: string;
  blockedUserId: string;
  blockedUserName: string;
  createdAt: Date;
}): UserBlock {
  return {
    id: record.id,
    blockerId: record.blockerId,
    blockedUserId: record.blockedUserId,
    blockedUserName: record.blockedUserName,
    createdAt: record.createdAt.toISOString(),
  };
}

function mapReport(record: {
  id: string;
  reporterId: string;
  reporterName: string;
  reportedUserId: string;
  reportedUserName: string;
  threadId: string | null;
  groupId: string | null;
  messageId: string | null;
  reason: string;
  status: string;
  createdAt: Date;
}): MessageReport {
  return {
    id: record.id,
    reporterId: record.reporterId,
    reporterName: record.reporterName,
    reportedUserId: record.reportedUserId,
    reportedUserName: record.reportedUserName,
    threadId: record.threadId ?? undefined,
    groupId: record.groupId ?? undefined,
    messageId: record.messageId ?? undefined,
    reason: record.reason,
    status: record.status as MessageReport["status"],
    createdAt: record.createdAt.toISOString(),
  };
}

export async function getBlocksForUser(userId: string) {
  const blocks = await prisma.userBlock.findMany({
    where: { blockerId: userId },
    orderBy: { createdAt: "desc" },
  });
  return blocks.map(mapBlock);
}

export async function getBlockedUserIds(userId: string) {
  const blocks = await getBlocksForUser(userId);
  return blocks.map((block) => block.blockedUserId);
}

export async function isUserBlocked(blockerId: string, blockedUserId: string) {
  const block = await prisma.userBlock.findFirst({
    where: { blockerId, blockedUserId },
  });
  return Boolean(block);
}

export async function hasMessagingBlock(userA: string, userB: string) {
  const [aBlocksB, bBlocksA] = await Promise.all([
    isUserBlocked(userA, userB),
    isUserBlocked(userB, userA),
  ]);
  return aBlocksB || bBlocksA;
}

export async function getMessagingBlockReason(senderId: string, recipientId: string) {
  if (await isUserBlocked(recipientId, senderId)) {
    return "This member is not available for messages.";
  }
  if (await isUserBlocked(senderId, recipientId)) {
    return "Unblock this member to send messages again.";
  }
  return null;
}

export async function blockUser(input: {
  blockerId: string;
  blockedUserId: string;
  blockedUserName: string;
}) {
  if (input.blockerId === input.blockedUserId) {
    throw new Error("You cannot block yourself.");
  }

  const existing = await prisma.userBlock.findFirst({
    where: {
      blockerId: input.blockerId,
      blockedUserId: input.blockedUserId,
    },
  });
  if (existing) {
    return mapBlock(existing);
  }

  const record = await prisma.userBlock.create({
    data: {
      id: `block-${Date.now()}`,
      blockerId: input.blockerId,
      blockedUserId: input.blockedUserId,
      blockedUserName: input.blockedUserName,
      createdAt: new Date(),
    },
  });

  return mapBlock(record);
}

export async function unblockUser(blockerId: string, blockedUserId: string) {
  await prisma.userBlock.deleteMany({
    where: { blockerId, blockedUserId },
  });
  return getBlocksForUser(blockerId);
}

export async function reportMember(input: {
  reporterId: string;
  reporterName: string;
  reportedUserId: string;
  reportedUserName: string;
  threadId?: string;
  groupId?: string;
  messageId?: string;
  reason: string;
}) {
  const reason = input.reason.trim();
  if (!reason) {
    throw new Error("Please describe what happened.");
  }

  const record = await prisma.messageReport.create({
    data: {
      id: `report-${Date.now()}`,
      reporterId: input.reporterId,
      reporterName: input.reporterName,
      reportedUserId: input.reportedUserId,
      reportedUserName: input.reportedUserName,
      threadId: input.threadId,
      groupId: input.groupId,
      messageId: input.messageId,
      reason,
      status: "open",
      createdAt: new Date(),
    },
  });

  const count = await prisma.messageReport.count();
  if (count > 500) {
    const oldest = await prisma.messageReport.findMany({
      orderBy: { createdAt: "asc" },
      take: count - 500,
      select: { id: true },
    });
    await prisma.messageReport.deleteMany({
      where: { id: { in: oldest.map((item) => item.id) } },
    });
  }

  return mapReport(record);
}

export async function getOpenReportsForLeaders(limit = 50) {
  const reports = await prisma.messageReport.findMany({
    where: { status: "open" },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
  return reports.map(mapReport);
}
