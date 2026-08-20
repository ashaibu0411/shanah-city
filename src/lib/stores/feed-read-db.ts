import { prisma } from "@/lib/db";
import type { FeedReadKey } from "@/lib/notification-types";

export async function getFeedLastReads(userId: string) {
  const records = await prisma.feedReadState.findMany({
    where: { userId },
  });
  return Object.fromEntries(
    records.map((record) => [record.feedKey, record.lastReadAt.toISOString()]),
  ) as Partial<Record<FeedReadKey, string>>;
}

export async function markFeedRead(userId: string, feedKey: FeedReadKey) {
  const now = new Date();
  await prisma.feedReadState.upsert({
    where: {
      userId_feedKey: { userId, feedKey },
    },
    create: {
      id: `feed-${userId}-${feedKey}`,
      userId,
      feedKey,
      lastReadAt: now,
    },
    update: {
      lastReadAt: now,
    },
  });
}

export async function markFeedsRead(userId: string, feedKeys: FeedReadKey[]) {
  await Promise.all(feedKeys.map((feedKey) => markFeedRead(userId, feedKey)));
}
