import type { PublicMember } from "@/lib/auth-types";
import { ADMIN_GROUP_ID } from "@/lib/church-groups";
import { getGroups } from "@/lib/group-server";
import { isGroupMember } from "@/lib/group-admin-utils";

export async function isAdminGroupMember(userId: string) {
  const groups = await getGroups();
  const adminGroup = groups.find((group) => group.id === ADMIN_GROUP_ID);
  if (!adminGroup) return false;
  return isGroupMember(adminGroup, userId);
}

export async function canManageAsAdmin(user: PublicMember | null) {
  if (!user) return false;
  return isAdminGroupMember(user.id);
}

export async function getAdminPermissions(user: PublicMember | null) {
  return { canManageAdmin: await canManageAsAdmin(user) };
}
