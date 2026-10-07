import type { PublicMember } from "@/lib/auth-types";
import { getGroupDetail } from "@/lib/group-server";
import type { CommunityPost } from "@/lib/member-types";
import { groupHasMinistryHub } from "@/lib/group-ministry-hub-types";

export async function resolveMinistryHubCommunityTarget(
  user: PublicMember,
  targetGroupId: string | undefined,
) {
  const groupId = targetGroupId?.trim();
  if (!groupId) {
    return { targetGroupId: undefined, targetGroupName: undefined };
  }

  if (!groupHasMinistryHub(groupId)) {
    throw new Error("This group cannot tag Community posts yet.");
  }

  const group = await getGroupDetail(groupId, user.id);
  if (!group?.isMember) {
    throw new Error("Join this group before posting to its prayer wall.");
  }

  return { targetGroupId: groupId, targetGroupName: group.name };
}

export function filterCommunityPostsForMinistryHub(
  posts: CommunityPost[],
  groupId: string,
  types: Array<CommunityPost["type"]> = ["prayer", "praise"],
) {
  const allowed = new Set(types);
  return posts
    .filter(
      (post) => post.targetGroupId === groupId && allowed.has(post.type),
    )
    .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
}
