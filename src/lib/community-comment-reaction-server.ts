import { prisma } from "@/lib/db";
import type { CommunityPost } from "@/lib/member-types";
import { useDatabase } from "@/lib/use-database";
import { nestComments } from "@/lib/community-comments";
import {
  attachReactionsToPosts,
} from "@/lib/community-post-reaction-server";
import {
  emptyPostReactionCounts,
  isPostReactionKind,
  type CommunityPostReactionCounts,
  type CommunityPostReactionKind,
} from "@/lib/community-post-reactions";

async function loadCommentReactionMaps(
  commentIds: string[],
  viewerId?: string | null,
): Promise<{
  countsByComment: Map<string, CommunityPostReactionCounts>;
  viewerByComment: Map<string, CommunityPostReactionKind[]>;
}> {
  const countsByComment = new Map<string, CommunityPostReactionCounts>();
  const viewerByComment = new Map<string, CommunityPostReactionKind[]>();

  if (commentIds.length === 0) {
    return { countsByComment, viewerByComment };
  }

  const records = await prisma.communityCommentReaction.findMany({
    where: { commentId: { in: commentIds } },
  });

  for (const record of records) {
    if (!isPostReactionKind(record.kind)) continue;
    const counts = countsByComment.get(record.commentId) ?? emptyPostReactionCounts();
    counts[record.kind] += 1;
    countsByComment.set(record.commentId, counts);

    if (viewerId && record.userId === viewerId) {
      const list = viewerByComment.get(record.commentId) ?? [];
      if (!list.includes(record.kind)) {
        list.push(record.kind);
      }
      viewerByComment.set(record.commentId, list);
    }
  }

  return { countsByComment, viewerByComment };
}

export async function enrichCommunityPostsForViewer(
  posts: CommunityPost[],
  viewerId?: string | null,
): Promise<CommunityPost[]> {
  const withPostReactions = await attachReactionsToPosts(posts, viewerId);

  if (!useDatabase()) {
    return withPostReactions.map((post) => ({
      ...post,
      comments: nestComments(
        (post.comments ?? []).map((comment) => ({
          ...comment,
          reactionCounts: emptyPostReactionCounts(),
          viewerReactions: [],
        })),
      ),
    }));
  }

  const allFlat = withPostReactions.flatMap((post) => post.comments ?? []);
  const commentIds = allFlat.map((comment) => comment.id);
  const { countsByComment, viewerByComment } = await loadCommentReactionMaps(
    commentIds,
    viewerId,
  );

  return withPostReactions.map((post) => {
    const flat = post.comments ?? [];
    const withCommentReactions = flat.map((comment) => ({
      ...comment,
      reactionCounts: countsByComment.get(comment.id) ?? emptyPostReactionCounts(),
      viewerReactions: viewerByComment.get(comment.id) ?? [],
    }));
    return {
      ...post,
      comments: nestComments(withCommentReactions),
    };
  });
}

export async function toggleCommunityCommentReaction(input: {
  commentId: string;
  userId: string;
  kind: CommunityPostReactionKind;
}) {
  if (!useDatabase()) {
    throw new Error("Emoji reactions require the database.");
  }

  const comment = await prisma.comment.findUnique({ where: { id: input.commentId } });
  if (!comment) {
    throw new Error("Comment not found.");
  }

  const existing = await prisma.communityCommentReaction.findFirst({
    where: {
      commentId: input.commentId,
      userId: input.userId,
      kind: input.kind,
    },
  });

  if (existing) {
    await prisma.communityCommentReaction.delete({ where: { id: existing.id } });
  } else {
    await prisma.communityCommentReaction.create({
      data: {
        id: `cr-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        commentId: input.commentId,
        userId: input.userId,
        kind: input.kind,
      },
    });
  }

  const records = await prisma.communityCommentReaction.findMany({
    where: { commentId: input.commentId },
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
