import type { PublicMember } from "@/lib/auth-types";
import { canManageAsAdmin } from "@/lib/admin-access-server";
import { isGroupAdmin } from "@/lib/group-admin-utils";
import { getGroupDetail, getGroups } from "@/lib/group-server";
import { memberHasFullGroupAccess } from "@/lib/ministry-readiness-server";
import { isUserInGroup } from "@/lib/media-group";
import { isKidsMinistryGroup, KIDS_GROUP_ID } from "@/lib/kids-types";

export { KIDS_GROUP_ID };

export function getConfiguredKidsGroupId() {
  return process.env.KIDS_GROUP_ID?.trim() || KIDS_GROUP_ID;
}

export async function userIsInKidsMinistryGroup(userId: string) {
  const configuredId = getConfiguredKidsGroupId();
  const access = await memberHasFullGroupAccess(userId, configuredId);
  if (access.group) {
    return access.allowed;
  }

  const groups = await getGroups();
  for (const group of groups) {
    if (!isUserInGroup(group, userId) || !isKidsMinistryGroup(group)) continue;
    const groupAccess = await memberHasFullGroupAccess(userId, group.id);
    if (groupAccess.allowed) return true;
  }
  return false;
}

export async function userIsKidsMinistryAdmin(userId: string) {
  if (await canManageAsAdmin({ id: userId })) return true;

  const configuredId = getConfiguredKidsGroupId();
  const detail = await getGroupDetail(configuredId, userId);
  if (detail?.isAdmin) return true;

  const groups = await getGroups();
  const group = groups.find((entry) => entry.id === configuredId);
  if (group && isGroupAdmin(group, userId)) return true;

  return groups.some(
    (entry) => isKidsMinistryGroup(entry) && isGroupAdmin(entry, userId),
  );
}

export async function canAccessKidsMinistry(user: Pick<PublicMember, "id"> | null) {
  if (!user) return false;
  if (await canManageAsAdmin(user)) return true;
  return userIsInKidsMinistryGroup(user.id);
}

export async function canManageKidsMinistry(user: PublicMember | null) {
  if (!user) return false;
  if (await canManageAsAdmin(user)) return true;
  return userIsKidsMinistryAdmin(user.id);
}

export async function getKidsMinistryPermissions(user: PublicMember | null) {
  const canAccess = await canAccessKidsMinistry(user);
  const canManage = canAccess ? await canManageKidsMinistry(user) : false;
  return {
    canAccessKidsMinistry: canAccess,
    canManageKidsMinistry: canManage,
  };
}
