import { prisma } from "@/lib/db";
import { getPublicDisplayName } from "@/lib/member-display-name";
import type { CommunityStoryReactionKind } from "@/lib/member-types";
import { COMMUNITY_STORY_REACTION_KINDS } from "@/lib/community-status-reaction-server";

export type StoryReactionInsight = {
  userId: string;
  name: string;
  kind: CommunityStoryReactionKind;
  createdAt: string;
};

export type StoryReplyInsight = {
  id: string;
  authorId: string;
  authorName: string;
  content: string;
  createdAt: string;
};

function isReactionKind(value: string): value is CommunityStoryReactionKind {
  return (COMMUNITY_STORY_REACTION_KINDS as readonly string[]).includes(value);
}

export async function getStoryInsightsForAuthor(input: { statusId: string; authorId: string }) {
  const status = await prisma.communityStatus.findUnique({
    where: { id: input.statusId },
  });

  if (!status) {
    throw new Error("Story not found.");
  }
  if (status.authorId !== input.authorId) {
    throw new Error("Only the story author can view responses.");
  }

  const [reactionRows, replyRows] = await Promise.all([
    prisma.communityStatusReaction.findMany({
      where: { statusId: input.statusId },
      orderBy: { createdAt: "desc" },
    }),
    prisma.communityStatusReply.findMany({
      where: { statusId: input.statusId },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const userIds = [...new Set(reactionRows.map((row) => row.userId))];
  const users =
    userIds.length === 0
      ? []
      : await prisma.user.findMany({
          where: { id: { in: userIds } },
          select: { id: true, name: true, displayName: true },
        });
  const nameById = new Map(
    users.map((user) => [user.id, getPublicDisplayName(user)] as const),
  );

  const reactions: StoryReactionInsight[] = [];
  for (const row of reactionRows) {
    if (!isReactionKind(row.kind)) continue;
    reactions.push({
      userId: row.userId,
      name: nameById.get(row.userId) ?? "Member",
      kind: row.kind,
      createdAt: row.createdAt.toISOString(),
    });
  }

  const replies: StoryReplyInsight[] = replyRows.map((row) => ({
    id: row.id,
    authorId: row.authorId,
    authorName: row.authorName,
    content: row.content,
    createdAt: row.createdAt.toISOString(),
  }));

  return { reactions, replies };
}

export async function addStoryReply(input: {
  statusId: string;
  authorId: string;
  authorName: string;
  content: string;
}) {
  const status = await prisma.communityStatus.findUnique({
    where: { id: input.statusId },
  });

  if (!status || status.expiresAt <= new Date()) {
    throw new Error("Story not found.");
  }
  if (status.authorId === input.authorId) {
    throw new Error("You cannot reply to your own story.");
  }

  const content = input.content.trim();
  if (!content) {
    throw new Error("Write a reply.");
  }

  const reply = await prisma.communityStatusReply.create({
    data: {
      id: `srp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      statusId: input.statusId,
      authorId: input.authorId,
      authorName: input.authorName,
      content: content.slice(0, 500),
    },
  });

  return {
    id: reply.id,
    authorId: reply.authorId,
    authorName: reply.authorName,
    content: reply.content,
    createdAt: reply.createdAt.toISOString(),
  };
}
