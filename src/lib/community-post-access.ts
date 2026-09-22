import type { CommunityPost } from "@/lib/member-types";
import { userMatchesStoredAuthorName } from "@/lib/member-display-name";
import { isUrgentAlertCommunityPostId } from "@/lib/urgent-alert-utils";

function isChurchNewsPost(post: Pick<CommunityPost, "id" | "type">) {
  return post.type === "announcement" || isUrgentAlertCommunityPostId(post.id);
}

export function isCommunityPostAuthor(
  user: Pick<{ id: string; name: string; displayName?: string | null }, "id" | "name" | "displayName">,
  post: Pick<CommunityPost, "author" | "authorId">,
) {
  if (post.authorId) {
    return post.authorId === user.id;
  }
  if (post.author) {
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
  post: Pick<CommunityPost, "author" | "authorId" | "id" | "type">,
  isAdmin = false,
) {
  if (!user) return false;
  if (isChurchNewsPost(post)) {
    return isAdmin;
  }
  if (isAdmin) return true;
  return isCommunityPostAuthor(user, post);
}
