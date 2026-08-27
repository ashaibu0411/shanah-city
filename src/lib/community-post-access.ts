import type { CommunityPost } from "@/lib/member-types";

function normalizeName(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

export function isCommunityPostAuthor(
  user: Pick<{ id: string; name: string }, "id" | "name">,
  post: Pick<CommunityPost, "author" | "authorId">,
) {
  if (post.authorId) {
    return post.authorId === user.id;
  }
  return normalizeName(post.author) === normalizeName(user.name);
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
