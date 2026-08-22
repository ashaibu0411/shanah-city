import type { PublicMember } from "@/lib/auth-types";
import { canManageAsAdmin } from "@/lib/admin-access-server";
import { canManageGroupEvents } from "@/lib/group-permissions-server";

export async function canCreateChurchPoll(user: PublicMember | null) {
  return canManageAsAdmin(user);
}

export async function canCreateGroupPoll(user: PublicMember | null, groupId: string) {
  return canManageGroupEvents(user, groupId);
}

export async function canManagePoll(
  user: PublicMember | null,
  poll: { createdBy: string; targetGroupId?: string },
) {
  if (!user) return false;
  if (user.id === poll.createdBy) return true;
  if (await canManageAsAdmin(user)) return true;
  if (poll.targetGroupId) {
    return canManageGroupEvents(user, poll.targetGroupId);
  }
  return false;
}
