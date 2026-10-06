import { prisma } from "@/lib/db";
import type {
  GroupMinistryPrayerPost,
  GroupPinnedAnnouncement,
} from "@/lib/group-ministry-hub-types";

export async function getGroupPinnedAnnouncement(groupId: string) {
  const record = await prisma.groupMinistryHubAnnouncement.findUnique({
    where: { groupId },
  });
  if (!record) return null;
  return {
    groupId: record.groupId,
    title: record.title,
    body: record.body,
    updatedAt: record.updatedAt.toISOString(),
    updatedBy: record.updatedBy ?? undefined,
    updatedByName: record.updatedByName ?? undefined,
  } satisfies GroupPinnedAnnouncement;
}

export async function saveGroupPinnedAnnouncement(input: {
  groupId: string;
  title: string;
  body: string;
  actor: { id: string; name: string };
}) {
  const record = await prisma.groupMinistryHubAnnouncement.upsert({
    where: { groupId: input.groupId },
    create: {
      groupId: input.groupId,
      title: input.title.trim(),
      body: input.body.trim(),
      updatedBy: input.actor.id,
      updatedByName: input.actor.name,
    },
    update: {
      title: input.title.trim(),
      body: input.body.trim(),
      updatedBy: input.actor.id,
      updatedByName: input.actor.name,
    },
  });
  return {
    groupId: record.groupId,
    title: record.title,
    body: record.body,
    updatedAt: record.updatedAt.toISOString(),
    updatedBy: record.updatedBy ?? undefined,
    updatedByName: record.updatedByName ?? undefined,
  } satisfies GroupPinnedAnnouncement;
}

export async function listGroupMinistryPrayerPosts(groupId: string, limit = 40) {
  const records = await prisma.groupMinistryPrayerPost.findMany({
    where: { groupId },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
  return records.map(
    (record): GroupMinistryPrayerPost => ({
      id: record.id,
      groupId: record.groupId,
      authorId: record.authorId,
      authorName: record.authorName,
      content: record.content,
      type: record.type as GroupMinistryPrayerPost["type"],
      createdAt: record.createdAt.toISOString(),
    }),
  );
}

export async function createGroupMinistryPrayerPost(input: {
  groupId: string;
  authorId: string;
  authorName: string;
  content: string;
  type: GroupMinistryPrayerPost["type"];
}) {
  const record = await prisma.groupMinistryPrayerPost.create({
    data: {
      id: `gmprayer-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      groupId: input.groupId,
      authorId: input.authorId,
      authorName: input.authorName,
      content: input.content.trim(),
      type: input.type,
    },
  });
  return {
    id: record.id,
    groupId: record.groupId,
    authorId: record.authorId,
    authorName: record.authorName,
    content: record.content,
    type: record.type as GroupMinistryPrayerPost["type"],
    createdAt: record.createdAt.toISOString(),
  } satisfies GroupMinistryPrayerPost;
}
