import { isAdminGroupMember } from "@/lib/admin-access-server";
import { isStaffManagedMinistryGroup } from "@/lib/church-groups";
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

export async function assertCanManageStaffOnlyGroup(userId: string) {
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
    await assertCanManageStaffOnlyGroup(actorId);
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
    await assertCanManageStaffOnlyGroup(actorId);
    return;
  }
  assertCanManageGroupLeadership(group, actorId, actorIsSiteAdmin);
}
