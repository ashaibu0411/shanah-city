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

/** Advances a feed watermark without clearing newer items in other feeds. */
export async function advanceFeedReadWatermark(
  userId: string,
  feedKey: FeedReadKey,
  readThroughIso: string,
) {
  const readThrough = new Date(readThroughIso);
  if (Number.isNaN(readThrough.getTime())) return;

  const record = await prisma.feedReadState.findUnique({
    where: { userId_feedKey: { userId, feedKey } },
  });
  const existing = record?.lastReadAt;
  const next = !existing || readThrough > existing ? readThrough : existing;

  await prisma.feedReadState.upsert({
    where: {
      userId_feedKey: { userId, feedKey },
    },
    create: {
      id: `feed-${userId}-${feedKey}`,
      userId,
      feedKey,
      lastReadAt: next,
    },
    update: {
      lastReadAt: next,
    },
  });
}
