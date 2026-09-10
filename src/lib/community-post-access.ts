import type { CommunityPost } from "@/lib/member-types";
import { userMatchesStoredAuthorName } from "@/lib/member-display-name";

export function isCommunityPostAuthor(
  user: Pick<{ id: string; name: string; displayName?: string | null }, "id" | "name" | "displayName">,
  post: Pick<CommunityPost, "author" | "authorId">,
) {
  if (post.authorId && post.authorId === user.id) {
    return true;
  }
  if (post.author && user.name) {
    return userMatchesStoredAuthorName(user, post.author);
  }
  return false;
}

export function attachCanManageToPosts(
  posts: CommunityPost[],
  user: Pick<{ id: string; name: string; displayName?: string | null }, "id" | "name" | "displayName"> | null | undefined,
  isAdmin = false,
): CommunityPost[] {
  return posts.map((post) => ({
    ...post,
    canManage: canManageCommunityPostClient(user, post, isAdmin),
  }));
}

export function canManageCommunityPostClient(
  user: Pick<{ id: string; name: string; displayName?: string | null }, "id" | "name" | "displayName"> | null | undefined,
  post: Pick<CommunityPost, "author" | "authorId">,
  isAdmin = false,
) {
  if (!user) return false;
  if (isAdmin) return true;
  return isCommunityPostAuthor(user, post);
}
