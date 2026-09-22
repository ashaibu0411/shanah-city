import type { Comment, CommunityPost } from "@/lib/member-types";
import { userMatchesStoredAuthorName } from "@/lib/member-display-name";

type CommentAuthorUser = Pick<
  { id: string; name: string; displayName?: string | null },
  "id" | "name" | "displayName"
>;

export function isCommunityCommentAuthor(
  user: CommentAuthorUser,
  comment: Pick<Comment, "author" | "authorId">,
) {
  if (comment.authorId) {
    return comment.authorId === user.id;
  }
  if (comment.author) {
    return userMatchesStoredAuthorName(user, comment.author);
  }
  return false;
}

export function canManageCommunityComment(
  user: CommentAuthorUser | null | undefined,
  comment: Pick<Comment, "author" | "authorId">,
  isAdmin = false,
) {
  if (!user) return false;
  if (isAdmin) return true;
  return isCommunityCommentAuthor(user, comment);
}

function mapCommentsWithCanManage(
  comments: Comment[],
  user: CommentAuthorUser | null | undefined,
  isAdmin: boolean,
): Comment[] {
  return comments.map((comment) => ({
    ...comment,
    canManage: canManageCommunityComment(user, comment, isAdmin),
    replies: comment.replies?.length
      ? mapCommentsWithCanManage(comment.replies, user, isAdmin)
      : comment.replies,
  }));
}

export function attachCanManageToPostComments(
  posts: CommunityPost[],
  user: CommentAuthorUser | null | undefined,
  isAdmin = false,
): CommunityPost[] {
  return posts.map((post) => ({
    ...post,
    comments: mapCommentsWithCanManage(post.comments ?? [], user, isAdmin),
  }));
}
