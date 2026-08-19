import { prisma } from "@/lib/db";
import type { ChatTypingUser } from "@/lib/chat-utils";

const TYPING_TTL_MS = 5000;

export async function setChatTyping(input: {
  channelType: "group" | "thread";
  channelId: string;
  userId: string;
  userName: string;
  isTyping: boolean;
}) {
  const id = `${input.channelType}:${input.channelId}:${input.userId}`;
  const now = new Date();

  await prisma.chatTypingIndicator.deleteMany({
    where: { expiresAt: { lt: now } },
  });

  if (!input.isTyping) {
    await prisma.chatTypingIndicator.deleteMany({
      where: {
        channelType: input.channelType,
        channelId: input.channelId,
        userId: input.userId,
      },
    });
    return;
  }

  await prisma.chatTypingIndicator.upsert({
    where: { channelType_channelId_userId: {
      channelType: input.channelType,
      channelId: input.channelId,
      userId: input.userId,
    }},
    create: {
      id,
      channelType: input.channelType,
      channelId: input.channelId,
      userId: input.userId,
      userName: input.userName,
      expiresAt: new Date(Date.now() + TYPING_TTL_MS),
    },
    update: {
      userName: input.userName,
      expiresAt: new Date(Date.now() + TYPING_TTL_MS),
    },
  });
}

export async function getChatTypingUsers(input: {
  channelType: "group" | "thread";
  channelId: string;
  excludeUserId?: string;
}): Promise<ChatTypingUser[]> {
  const now = new Date();
  await prisma.chatTypingIndicator.deleteMany({
    where: { expiresAt: { lt: now } },
  });

  const records = await prisma.chatTypingIndicator.findMany({
    where: {
      channelType: input.channelType,
      channelId: input.channelId,
      ...(input.excludeUserId ? { userId: { not: input.excludeUserId } } : {}),
    },
  });

  const seen = new Set<string>();
  const users: ChatTypingUser[] = [];
  for (const record of records) {
    if (seen.has(record.userId)) continue;
    seen.add(record.userId);
    users.push({ userId: record.userId, userName: record.userName });
  }
  return users;
}
