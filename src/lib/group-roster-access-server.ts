import type { PublicMember } from "@/lib/auth-types";
import { canManageAsAdmin } from "@/lib/admin-access-server";
import { getGroupDetail } from "@/lib/group-server";
import { isMemberTrainingRequired } from "@/lib/ministry-readiness-server";
import { groupUsesServiceRoster } from "@/lib/group-roster-types";

export async function canManageGroupRoster(
  user: PublicMember | null,
  groupId: string,
): Promise<boolean> {
  if (!user) return false;
  if (await canManageAsAdmin(user)) return true;
  const group = await getGroupDetail(groupId, user.id);
  if (!group) return false;
  return group.isAdmin || group.isAssistantLeader;
}

export async function canViewGroupRoster(user: PublicMember | null, groupId: string) {
  if (!user) return false;
  if (await canManageAsAdmin(user)) return true;
  const group = await getGroupDetail(groupId, user.id);
  if (!group?.isMember) return false;
  if (await isMemberTrainingRequired(user.id, group)) return false;
  return groupUsesServiceRoster(group);
}

export function canViewRosterRecord(
  userId: string,
  canManage: boolean,
  roster: { status: string; assignments: Array<{ userId?: string | null }> },
) {
  if (canManage) return true;
  if (roster.status !== "published") return false;
  return true;
}
