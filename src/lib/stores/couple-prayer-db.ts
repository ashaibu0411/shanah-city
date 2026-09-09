import { prisma } from "@/lib/db";
import type { CouplePrayerPostRecord } from "@/lib/couple-prayer-types";

function mapPost(record: {
  id: string;
  coupleLinkId: string;
  authorId: string;
  authorName: string;
  content: string;
  type: string;
  createdAt: Date;
}): CouplePrayerPostRecord {
  return {
    id: record.id,
    coupleLinkId: record.coupleLinkId,
    authorId: record.authorId,
    authorName: record.authorName,
    content: record.content,
    type: record.type as CouplePrayerPostRecord["type"],
    createdAt: record.createdAt.toISOString(),
  };
}

export async function getCouplePrayerPosts(coupleLinkId: string) {
  const records = await prisma.couplePrayerPost.findMany({
    where: { coupleLinkId },
    orderBy: { createdAt: "desc" },
  });
  return records.map(mapPost);
}

export async function createCouplePrayerPost(input: {
  coupleLinkId: string;
  authorId: string;
  authorName: string;
  content: string;
  type?: CouplePrayerPostRecord["type"];
}) {
  const record = await prisma.couplePrayerPost.create({
    data: {
      id: `cprayer-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      coupleLinkId: input.coupleLinkId,
      authorId: input.authorId,
      authorName: input.authorName,
      content: input.content.trim(),
      type: input.type ?? "prayer",
    },
  });
  return mapPost(record);
}
