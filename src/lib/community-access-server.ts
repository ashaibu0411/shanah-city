import { canManageAsAdmin } from "@/lib/admin-access-server";
import type { MemberProfile } from "@/lib/auth-types";
import type { CommunityPost } from "@/lib/member-types";

export async function canManageCommunityPost(
  user: Pick<MemberProfile, "id"> | null | undefined,
  post: Pick<CommunityPost, "authorId">,
) {
  if (!user) return false;
  if (post.authorId && post.authorId === user.id) return true;
  return canManageAsAdmin(user);
}
