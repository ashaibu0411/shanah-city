import { isAdminGroupMember } from "@/lib/admin-access-server";
import { isAdminManagedOnlyGroup, isStaffManagedMinistryGroup } from "@/lib/church-groups";
import {
  assertCanManageGroupLeadership,
  assertCanManageGroupMembers,
} from "@/lib/group-leadership-access";
import type { Group } from "@/lib/group-types";

/** Admin Group members plus Senior / Associate Pastor assignments. */
export async function canManageStaffOnlyGroups(userId: string) {
  if (await isAdminGroupMember(userId)) {
    return true;
  }
  const { userHasPastoralMinistryRole } = await import("@/lib/pastoral-roles-server");
  return userHasPastoralMinistryRole(userId);
}

export async function assertCanManageStaffOnlyGroup(userId: string, groupId?: string) {
  if (groupId && isAdminManagedOnlyGroup(groupId)) {
    if (await isAdminGroupMember(userId)) {
      return;
    }
    throw new Error("Only Admin Group members can manage Team ZNCF.");
  }
  if (await canManageStaffOnlyGroups(userId)) {
    return;
  }
  throw new Error("Only church admins or pastors can manage this team.");
}

export async function assertCanManageGroupMembersForGroup(
  group: Pick<Group, "id" | "adminIds" | "assistantAdminIds">,
  actorId: string,
  actorIsSiteAdmin: boolean,
) {
  if (isStaffManagedMinistryGroup(group.id)) {
    await assertCanManageStaffOnlyGroup(actorId, group.id);
    return;
  }
  assertCanManageGroupMembers(group, actorId, actorIsSiteAdmin);
}

export async function assertCanManageGroupLeadershipForGroup(
  group: Pick<Group, "id" | "adminIds" | "assistantAdminIds">,
  actorId: string,
  actorIsSiteAdmin: boolean,
) {
  if (isStaffManagedMinistryGroup(group.id)) {
    await assertCanManageStaffOnlyGroup(actorId, group.id);
    return;
  }
  assertCanManageGroupLeadership(group, actorId, actorIsSiteAdmin);
}
