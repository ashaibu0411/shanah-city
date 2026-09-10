import type { PublicMember } from "@/lib/auth-types";
import { canManageAsAdmin } from "@/lib/admin-access-server";
import { canManageGroupEvents } from "@/lib/group-permissions-server";
import { getGroupDetail, getGroups } from "@/lib/group-server";
import { memberHasFullGroupAccess } from "@/lib/ministry-readiness-server";
import { isUserInGroup } from "@/lib/media-group";
import { WORSHIP_GROUP_ID } from "@/lib/worship-types";

export { WORSHIP_GROUP_ID };

export function getConfiguredWorshipGroupId() {
  return process.env.WORSHIP_GROUP_ID?.trim() || WORSHIP_GROUP_ID;
}

export function isWorshipGroup(group: { id: string; name: string }) {
  const configuredId = getConfiguredWorshipGroupId();
  if (configuredId) {
    return group.id === configuredId;
  }
  const name = group.name.trim().toLowerCase();
  return name.includes("worship") || name.includes("choir");
}

export async function userIsInWorshipGroup(userId: string) {
  const configuredId = getConfiguredWorshipGroupId();
  const access = await memberHasFullGroupAccess(userId, configuredId);
  if (access.group) {
    return access.allowed;
  }

  const groups = await getGroups();
  for (const group of groups) {
    if (!isWorshipGroup(group) || !isUserInGroup(group, userId)) continue;
    const groupAccess = await memberHasFullGroupAccess(userId, group.id);
    if (groupAccess.allowed) return true;
  }
  return false;
}

export async function canAccessWorshipPlanner(user: Pick<PublicMember, "id"> | null) {
  if (!user) return false;
  if (await canManageAsAdmin(user)) return true;
  return userIsInWorshipGroup(user.id);
}

export async function canManageWorshipPlan(user: PublicMember | null) {
  if (!user) return false;
  return canManageGroupEvents(user, getConfiguredWorshipGroupId());
}

export async function getWorshipPermissions(user: PublicMember | null) {
  const canAccess = await canAccessWorshipPlanner(user);
  const canManage = canAccess ? await canManageWorshipPlan(user) : false;
  return {
    canAccessWorshipPlanner: canAccess,
    canManageWorshipPlan: canManage,
  };
}
