import { prisma } from "@/lib/db";
import { communityStatusExpiry } from "@/lib/community-media-server";

export type CommunityStatusRecord = {
  id: string;
  authorId: string;
  authorName: string;
  mediaUrl: string;
  mediaType: "image" | "video";
  caption?: string;
  createdAt: string;
  expiresAt: string;
};

function mapStatus(record: {
  id: string;
  authorId: string;
  authorName: string;
  mediaUrl: string;
  mediaType: string;
  caption: string | null;
  createdAt: Date;
  expiresAt: Date;
}): CommunityStatusRecord {
  return {
    id: record.id,
    authorId: record.authorId,
    authorName: record.authorName,
    mediaUrl: record.mediaUrl,
    mediaType: record.mediaType as "image" | "video",
    caption: record.caption ?? undefined,
    createdAt: record.createdAt.toISOString(),
    expiresAt: record.expiresAt.toISOString(),
  };
}

export async function getActiveCommunityStatuses() {
  const now = new Date();
  const statuses = await prisma.communityStatus.findMany({
    where: { expiresAt: { gt: now } },
    orderBy: { createdAt: "desc" },
  });
  return statuses.map(mapStatus);
}

export async function addCommunityStatus(input: {
  id: string;
  authorId: string;
  authorName: string;
  mediaUrl: string;
  mediaType: "image" | "video";
  caption?: string;
}) {
  const created = await prisma.communityStatus.create({
    data: {
      id: input.id,
      authorId: input.authorId,
      authorName: input.authorName,
      mediaUrl: input.mediaUrl,
      mediaType: input.mediaType,
      caption: input.caption ?? null,
      expiresAt: communityStatusExpiry(),
    },
  });
  return mapStatus(created);
}

export async function deleteExpiredCommunityStatuses() {
  await prisma.communityStatus.deleteMany({
    where: { expiresAt: { lte: new Date() } },
  });
}

export async function deleteCommunityStatus(input: { id: string; authorId: string }) {
  const existing = await prisma.communityStatus.findUnique({
    where: { id: input.id },
  });

  if (!existing) return null;
  if (existing.authorId !== input.authorId) return "forbidden";

  await prisma.communityStatus.delete({
    where: { id: input.id },
  });

  return mapStatus(existing);
}
