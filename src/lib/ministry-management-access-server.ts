import type { PublicMember } from "@/lib/auth-types";
import { canManageAsAdmin } from "@/lib/admin-access-server";
import { isGroupMember } from "@/lib/group-admin-utils";
import { getGroups } from "@/lib/group-server";

export const SENIOR_PASTOR_GROUP_ID = "group-senior-pastor";
export const ASSOCIATE_PASTOR_GROUP_ID = "group-associate-pastor";

export const MINISTRY_MANAGEMENT_GROUP_IDS = [
  SENIOR_PASTOR_GROUP_ID,
  ASSOCIATE_PASTOR_GROUP_ID,
] as const;

async function isMemberOfMinistryManagementGroup(userId: string) {
  const groups = await getGroups();
  return MINISTRY_MANAGEMENT_GROUP_IDS.some((groupId) => {
    const group = groups.find((entry) => entry.id === groupId);
    return group ? isGroupMember(group, userId) : false;
  });
}

/** Admin Group, Senior Pastor, or Associate/Assistant Pastor — not the general Pastors group. */
export async function canManageMinistry(user: Pick<PublicMember, "id"> | null) {
  if (!user) return false;
  if (await canManageAsAdmin(user)) return true;
  return isMemberOfMinistryManagementGroup(user.id);
}

export async function getMinistryManagementPermissions(user: Pick<PublicMember, "id"> | null) {
  const allowed = await canManageMinistry(user);
  return {
    canManageMinistry: allowed,
    canReviewMinistryReports: allowed,
  };
}
