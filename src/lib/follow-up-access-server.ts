import type { PublicMember } from "@/lib/auth-types";
import { canManageAsAdmin } from "@/lib/admin-access-server";
import { isGroupAdmin } from "@/lib/group-admin-utils";
import { getGroupDetail, getGroups } from "@/lib/group-server";
import { memberHasFullGroupAccess } from "@/lib/ministry-readiness-server";
import { isUserInGroup } from "@/lib/media-group";
import { FOLLOW_UP_GROUP_ID, isFollowUpGroup } from "@/lib/follow-up-types";

export { FOLLOW_UP_GROUP_ID };

export function getConfiguredFollowUpGroupId() {
  return process.env.FOLLOW_UP_GROUP_ID?.trim() || FOLLOW_UP_GROUP_ID;
}

export async function userIsInFollowUpGroup(userId: string) {
  const configuredId = getConfiguredFollowUpGroupId();
  const access = await memberHasFullGroupAccess(userId, configuredId);
  if (access.group) {
    return access.allowed;
  }

  const groups = await getGroups();
  for (const group of groups) {
    if (!isUserInGroup(group, userId) || !isFollowUpGroup(group)) continue;
    const groupAccess = await memberHasFullGroupAccess(userId, group.id);
    if (groupAccess.allowed) return true;
  }
  return false;
}

export async function userIsFollowUpLeader(userId: string) {
  if (await canManageAsAdmin({ id: userId })) return true;

  const configuredId = getConfiguredFollowUpGroupId();
  const detail = await getGroupDetail(configuredId, userId);
  if (detail?.isAdmin) return true;

  const groups = await getGroups();
  const configuredGroup = groups.find((entry) => entry.id === configuredId);
  if (configuredGroup && isGroupAdmin(configuredGroup, userId)) return true;

  return groups.some((entry) => isFollowUpGroup(entry) && isGroupAdmin(entry, userId));
}

export async function canAccessFollowUp(user: Pick<PublicMember, "id"> | null) {
  if (!user) return false;
  if (await canManageAsAdmin(user)) return true;
  return userIsInFollowUpGroup(user.id);
}

export async function canManageFollowUp(user: PublicMember | null) {
  if (!user) return false;
  if (await canManageAsAdmin(user)) return true;
  return userIsFollowUpLeader(user.id);
}

export async function getFollowUpPermissions(user: PublicMember | null) {
  const canAccess = await canAccessFollowUp(user);
  const canManage = canAccess ? await canManageFollowUp(user) : false;
  return {
    canAccessFollowUp: canAccess,
    canManageFollowUp: canManage,
  };
}
