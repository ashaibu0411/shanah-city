import type { PublicMember } from "@/lib/auth-types";
import { canManageAsAdmin } from "@/lib/admin-access-server";
import { canManageGroupEvents } from "@/lib/group-permissions-server";
import { getGroupDetail, getGroups } from "@/lib/group-server";
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
  const detail = await getGroupDetail(configuredId, userId);
  if (detail) {
    return detail.isMember || detail.isAdmin;
  }

  const groups = await getGroups();
  return groups.some((group) => isWorshipGroup(group) && isUserInGroup(group, userId));
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
