import type { Group } from "@/lib/group-types";
import {
  isGroupAdmin,
  isGroupAssistantLeader,
  isGroupMember,
} from "@/lib/group-admin-utils";
import {
  isAdminManagedOnlyGroup,
  isStaffManagedMinistryGroup,
} from "@/lib/church-groups";
import { canManageStaffOnlyGroups } from "@/lib/group-staff-access-server";
import { isAdminGroupMember } from "@/lib/admin-access-server";

function canViewOpenOrMemberGroup(group: Group, userId?: string) {
  if (group.visibility === "public") {
    return true;
  }
  if (!userId) {
    return false;
  }
  return (
    isGroupMember(group, userId) ||
    isGroupAdmin(group, userId) ||
    isGroupAssistantLeader(group, userId)
  );
}

export async function canUserViewGroup(group: Group, userId?: string) {
  if (isAdminManagedOnlyGroup(group.id)) {
    if (!userId) {
      return false;
    }
    if (
      isGroupMember(group, userId) ||
      isGroupAdmin(group, userId) ||
      isGroupAssistantLeader(group, userId)
    ) {
      return true;
    }
    return isAdminGroupMember(userId);
  }

  if (!isStaffManagedMinistryGroup(group.id)) {
    return canViewOpenOrMemberGroup(group, userId);
  }

  if (!userId) {
    return false;
  }

  if (
    isGroupMember(group, userId) ||
    isGroupAdmin(group, userId) ||
    isGroupAssistantLeader(group, userId)
  ) {
    return true;
  }

  return canManageStaffOnlyGroups(userId);
}

export function assertStaffManagedGroupNotSelfServe(group: Pick<Group, "id" | "name">) {
  if (!isStaffManagedMinistryGroup(group.id)) {
    return;
  }
  if (isAdminManagedOnlyGroup(group.id)) {
    throw new Error(
      `"${group.name}" is private. Only Admin Group members can add people to this team.`,
    );
  }
  throw new Error(
    `"${group.name}" is managed by church leadership. Ask an admin or pastor to add you.`,
  );
}
