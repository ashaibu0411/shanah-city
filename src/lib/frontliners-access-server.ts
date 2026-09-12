import type { PublicMember } from "@/lib/auth-types";
import { canManageAsAdmin } from "@/lib/admin-access-server";
import { canAccessFollowUp } from "@/lib/follow-up-access-server";
import { isGroupAdmin } from "@/lib/group-admin-utils";
import { getGroupDetail, getGroups } from "@/lib/group-server";
import { memberHasFullGroupAccess } from "@/lib/ministry-readiness-server";
import { isUserInGroup } from "@/lib/media-group";
import { FRONTLINERS_GROUP_ID } from "@/lib/frontliners-types";

export { FRONTLINERS_GROUP_ID };

export function getConfiguredFrontLinersGroupId() {
  return process.env.FRONTLINERS_GROUP_ID?.trim() || FRONTLINERS_GROUP_ID;
}

export async function userIsInFrontLinersGroup(userId: string) {
  const configuredId = getConfiguredFrontLinersGroupId();
  const access = await memberHasFullGroupAccess(userId, configuredId);
  if (access.group) {
    return access.allowed;
  }

  const groups = await getGroups();
  for (const group of groups) {
    if (group.id !== configuredId || !isUserInGroup(group, userId)) continue;
    const groupAccess = await memberHasFullGroupAccess(userId, group.id);
    if (groupAccess.allowed) return true;
  }
  return false;
}

export async function userIsFrontLinersAdmin(userId: string) {
  if (await canManageAsAdmin({ id: userId })) return true;
  const configuredId = getConfiguredFrontLinersGroupId();
  const detail = await getGroupDetail(configuredId, userId);
  if (detail?.isAdmin) return true;

  const groups = await getGroups();
  const group = groups.find((entry) => entry.id === configuredId);
  return group ? isGroupAdmin(group, userId) : false;
}

export async function canAccessFrontLiners(user: Pick<PublicMember, "id"> | null) {
  if (!user) return false;
  if (await canManageAsAdmin(user)) return true;
  return userIsInFrontLinersGroup(user.id);
}

export async function canManageFrontLiners(user: PublicMember | null) {
  if (!user) return false;
  if (await canManageAsAdmin(user)) return true;
  return userIsFrontLinersAdmin(user.id);
}

export async function canManageGuestSubmissions(user: PublicMember | null) {
  if (!user) return false;
  if (await canManageAsAdmin(user)) return true;
  return canAccessFollowUp(user);
}

export async function getFrontLinersPermissions(user: PublicMember | null) {
  const canAccess = await canAccessFrontLiners(user);
  const canManage = canAccess ? await canManageFrontLiners(user) : false;
  return {
    canAccessFrontLiners: canAccess,
    canManageFrontLiners: canManage,
  };
}
