import type { CommunityPost } from "@/lib/member-types";

function normalizeName(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

export function isCommunityPostAuthor(
  user: Pick<{ id: string; name: string }, "id" | "name">,
  post: Pick<CommunityPost, "author" | "authorId">,
) {
  if (post.authorId && post.authorId === user.id) {
    return true;
  }
  if (post.author && user.name) {
    return normalizeName(post.author) === normalizeName(user.name);
  }
  return false;
}

export function attachCanManageToPosts(
  posts: CommunityPost[],
  user: Pick<{ id: string; name: string }, "id" | "name"> | null | undefined,
  isAdmin = false,
): CommunityPost[] {
  return posts.map((post) => ({
    ...post,
    canManage: canManageCommunityPostClient(user, post, isAdmin),
  }));
}

export function canManageCommunityPostClient(
  user: Pick<{ id: string; name: string }, "id" | "name"> | null | undefined,
  post: Pick<CommunityPost, "author" | "authorId">,
  isAdmin = false,
) {
  if (!user) return false;
  if (isAdmin) return true;
  return isCommunityPostAuthor(user, post);
}
