import { canManageAsAdmin } from "@/lib/admin-access-server";
import { isCommunityPostAuthor } from "@/lib/community-post-access";
import type { MemberProfile } from "@/lib/auth-types";
import type { CommunityPost } from "@/lib/member-types";

export async function canManageCommunityPost(
  user: Pick<MemberProfile, "id" | "name"> | null | undefined,
  post: Pick<CommunityPost, "authorId" | "author">,
) {
  if (!user) return false;
  if (isCommunityPostAuthor(user, post)) return true;
  return canManageAsAdmin(user);
}
