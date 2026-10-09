import { canManageAsAdmin } from "@/lib/admin-access-server";
import { attachCanManageToPosts } from "@/lib/community-post-access";
import { attachCanManageToPostComments } from "@/lib/community-comment-access";
import { enrichCommunityPostsForViewer } from "@/lib/community-comment-reaction-server";
import {
  COUPLES_COMMUNITY_GROUP_ID,
  couplesCommunityFeedFilter,
  type CouplesCommunityFeedMode,
} from "@/lib/couples-community-constants";
import { getGroups } from "@/lib/group-server";
import { getCommunityPostsForViewer } from "@/lib/member-server";
import type { PublicMember } from "@/lib/auth-types";
import type { CommunityPost } from "@/lib/member-types";

export type { CouplesCommunityFeedMode } from "@/lib/couples-community-constants";
export { COUPLES_COMMUNITY_GROUP_ID, couplesCommunityFeedFilter } from "@/lib/couples-community-constants";

function matchesCouplesFeedMode(post: CommunityPost, mode: CouplesCommunityFeedMode) {
  if (post.targetGroupId !== COUPLES_COMMUNITY_GROUP_ID) return false;
  if (mode === "announcements") return post.type === "announcement";
  if (mode === "prayer") return post.type === "prayer" || post.type === "praise";
  return post.type !== "announcement";
}

export async function getCouplesCommunityPostsForViewer(
  user: PublicMember | null | undefined,
  mode: CouplesCommunityFeedMode,
) {
  const [posts, isAdmin, groups] = await Promise.all([
    getCommunityPostsForViewer(user?.id),
    user ? canManageAsAdmin(user) : Promise.resolve(false),
    getGroups(),
  ]);
  const enriched = await enrichCommunityPostsForViewer(posts, user?.id);
  const withAccess = attachCanManageToPosts(enriched, user, isAdmin);
  const withComments = attachCanManageToPostComments(withAccess, user, isAdmin);
  const filtered = withComments.filter((post) => matchesCouplesFeedMode(post, mode));
  const groupName =
    groups.find((entry) => entry.id === COUPLES_COMMUNITY_GROUP_ID)?.name ?? "Shanah Power Couples";

  return {
    posts: filtered,
    groupName,
    initialFilter: couplesCommunityFeedFilter(mode),
  };
}
