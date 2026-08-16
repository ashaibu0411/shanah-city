import type { PublicMember } from "@/lib/auth-types";
import { canManageAsAdmin } from "@/lib/admin-access-server";
import { getGroupDetail, getGroups } from "@/lib/group-server";
import { isUserInGroup } from "@/lib/media-group";
import { FINANCE_GROUP_ID } from "@/lib/finance-types";

export { FINANCE_GROUP_ID };

export function getConfiguredFinanceGroupId() {
  return process.env.FINANCE_GROUP_ID?.trim() || FINANCE_GROUP_ID;
}

export function isFinanceGroup(group: { id: string; name: string }) {
  const configuredId = getConfiguredFinanceGroupId();
  if (configuredId) {
    return group.id === configuredId;
  }
  return group.name.trim().toLowerCase() === "finance team";
}

export async function userIsInFinanceGroup(userId: string) {
  const configuredId = getConfiguredFinanceGroupId();
  const detail = await getGroupDetail(configuredId, userId);
  if (detail) {
    return detail.isMember || detail.isAdmin;
  }

  const groups = await getGroups();
  return groups.some((group) => isFinanceGroup(group) && isUserInGroup(group, userId));
}

export async function canAccessFinance(user: Pick<PublicMember, "id"> | null) {
  if (!user) return false;
  if (await canManageAsAdmin(user)) return true;
  return userIsInFinanceGroup(user.id);
}

export async function getFinancePermissions(user: Pick<PublicMember, "id"> | null) {
  return { canAccessFinance: await canAccessFinance(user) };
}
