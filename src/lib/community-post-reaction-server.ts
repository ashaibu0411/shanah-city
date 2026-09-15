import { prisma } from "@/lib/db";
import type { CommunityPost } from "@/lib/member-types";
import { useDatabase } from "@/lib/use-database";
import {
  COMMUNITY_POST_REACTION_KINDS,
  emptyPostReactionCounts,
  isPostReactionKind,
  type CommunityPostReactionCounts,
  type CommunityPostReactionKind,
} from "@/lib/community-post-reactions";

export async function attachReactionsToPosts(
  posts: CommunityPost[],
  viewerId?: string | null,
): Promise<
  (CommunityPost & {
    reactionCounts: CommunityPostReactionCounts;
    viewerReactions: CommunityPostReactionKind[];
  })[]
> {
  if (posts.length === 0) return [];

  if (!useDatabase()) {
    return posts.map((post) => ({
      ...post,
      reactionCounts: emptyPostReactionCounts(),
      viewerReactions: [],
    }));
  }

  const postIds = posts.map((post) => post.id);
  const records = await prisma.communityPostReaction.findMany({
    where: { postId: { in: postIds } },
  });

  const countsByPost = new Map<string, CommunityPostReactionCounts>();
  const viewerByPost = new Map<string, CommunityPostReactionKind[]>();

  for (const record of records) {
    if (!isPostReactionKind(record.kind)) continue;
    const counts = countsByPost.get(record.postId) ?? emptyPostReactionCounts();
    counts[record.kind] += 1;
    countsByPost.set(record.postId, counts);

    if (viewerId && record.userId === viewerId) {
      const list = viewerByPost.get(record.postId) ?? [];
      if (!list.includes(record.kind)) {
        list.push(record.kind);
      }
      viewerByPost.set(record.postId, list);
    }
  }

  return posts.map((post) => ({
    ...post,
    reactionCounts: countsByPost.get(post.id) ?? emptyPostReactionCounts(),
    viewerReactions: viewerByPost.get(post.id) ?? [],
  }));
}

export async function toggleCommunityPostReaction(input: {
  postId: string;
  userId: string;
  kind: CommunityPostReactionKind;
}) {
  if (!useDatabase()) {
    throw new Error("Emoji reactions require the database.");
  }

  const post = await prisma.communityPost.findUnique({ where: { id: input.postId } });
  if (!post) {
    throw new Error("Post not found.");
  }

  const existing = await prisma.communityPostReaction.findFirst({
    where: {
      postId: input.postId,
      userId: input.userId,
      kind: input.kind,
    },
  });

  if (existing) {
    await prisma.communityPostReaction.delete({ where: { id: existing.id } });
  } else {
    await prisma.communityPostReaction.create({
      data: {
        id: `pr-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        postId: input.postId,
        userId: input.userId,
        kind: input.kind,
      },
    });
  }

  const records = await prisma.communityPostReaction.findMany({
    where: { postId: input.postId },
  });

  const reactionCounts = emptyPostReactionCounts();
  const viewerReactions: CommunityPostReactionKind[] = [];

  for (const record of records) {
    if (!isPostReactionKind(record.kind)) continue;
    reactionCounts[record.kind] += 1;
    if (record.userId === input.userId && !viewerReactions.includes(record.kind)) {
      viewerReactions.push(record.kind);
    }
  }

  return { reactionCounts, viewerReactions };
}
