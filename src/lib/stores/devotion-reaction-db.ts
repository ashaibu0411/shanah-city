import { prisma } from "@/lib/db";
import type { ChatMessageReaction } from "@/lib/chat-utils";

function mapReaction(record: {
  emoji: string;
  userId: string;
  userName: string;
}): ChatMessageReaction {
  return {
    emoji: record.emoji,
    userId: record.userId,
    userName: record.userName,
  };
}

export async function getDevotionReactions(devotionId: string): Promise<ChatMessageReaction[]> {
  const records = await prisma.devotionReaction.findMany({
    where: { devotionId },
    orderBy: { createdAt: "asc" },
  });
  return records.map(mapReaction);
}

export async function toggleDevotionReaction(input: {
  devotionId: string;
  userId: string;
  userName: string;
  emoji: string;
}): Promise<ChatMessageReaction[]> {
  const existing = await prisma.devotionReaction.findFirst({
    where: {
      devotionId: input.devotionId,
      userId: input.userId,
      emoji: input.emoji,
    },
  });

  if (existing) {
    await prisma.devotionReaction.delete({ where: { id: existing.id } });
  } else {
    await prisma.devotionReaction.create({
      data: {
        id: `dev-react-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        devotionId: input.devotionId,
        userId: input.userId,
        userName: input.userName,
        emoji: input.emoji,
        createdAt: new Date(),
      },
    });
  }

  return getDevotionReactions(input.devotionId);
}

export async function deleteDevotionReactionsForUser(userId: string) {
  await prisma.devotionReaction.deleteMany({ where: { userId } });
}
