import { canManageAsAdmin } from "@/lib/admin-access-server";
import { canManageCommunityComment as canManageCommunityCommentClient } from "@/lib/community-comment-access";
import { isCommunityPostAuthor } from "@/lib/community-post-access";
import type { MemberProfile } from "@/lib/auth-types";
import type { Comment, CommunityPost } from "@/lib/member-types";

export async function canManageCommunityPost(
  user: Pick<MemberProfile, "id" | "name"> | null | undefined,
  post: Pick<CommunityPost, "authorId" | "author">,
) {
  if (!user) return false;
  if (isCommunityPostAuthor(user, post)) return true;
  return canManageAsAdmin(user);
}

export async function canManageCommunityComment(
  user: Pick<MemberProfile, "id" | "name" | "displayName"> | null | undefined,
  comment: Pick<Comment, "authorId" | "author">,
) {
  if (!user) return false;
  if (await canManageAsAdmin(user)) return true;
  return canManageCommunityCommentClient(user, comment, false);
}
