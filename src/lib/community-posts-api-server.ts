import { canManageAsAdmin } from "@/lib/admin-access-server";
import { attachCanManageToPosts } from "@/lib/community-post-access";
import { attachCanManageToPostComments } from "@/lib/community-comment-access";
import { enrichCommunityPostsForViewer } from "@/lib/community-comment-reaction-server";
import { filterCommunityPostsForMinistryHub } from "@/lib/group-ministry-community-server";
import type { CommunityPost } from "@/lib/member-types";
import { getCommunityPostsForViewer } from "@/lib/member-server";
import { getUserFromSession } from "@/lib/auth-server";

export async function listCommunityPostsForApi(
  user: Awaited<ReturnType<typeof getUserFromSession>>,
  options?: {
    groupId?: string;
    types?: string;
  },
) {
  let posts = await getCommunityPostsForViewer(user?.id);
  const isAdmin = user ? await canManageAsAdmin(user) : false;

  const groupId = options?.groupId?.trim();
  if (groupId) {
    const typeList = (options?.types ?? "prayer,praise")
      .split(",")
      .map((entry) => entry.trim())
      .filter((entry): entry is CommunityPost["type"] =>
        entry === "prayer" || entry === "praise" || entry === "general" || entry === "announcement",
      );
    posts = filterCommunityPostsForMinistryHub(posts, groupId, typeList);
  }

  const withReactions = await enrichCommunityPostsForViewer(posts, user?.id);
  const withPostAccess = attachCanManageToPosts(withReactions, user, isAdmin);
  return attachCanManageToPostComments(withPostAccess, user, isAdmin);
}
