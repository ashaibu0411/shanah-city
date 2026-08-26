import type { Group } from "@/lib/group-types";
import {
  assertAnotherAdminRemains,
  isGroupAdmin,
  isGroupAssistantLeader,
  isGroupMember,
} from "@/lib/group-admin-utils";

export function assertCanManageGroupMembers(
  group: Pick<Group, "adminIds" | "assistantAdminIds">,
  actorId: string,
  actorIsSiteAdmin: boolean,
) {
  if (actorIsSiteAdmin) return;
  if (isGroupAdmin(group, actorId)) return;
  if (isGroupAssistantLeader(group, actorId)) return;
  throw new Error("Only group leaders or assistants can manage members.");
}

export function assertCanManageGroupLeadership(
  group: Pick<Group, "adminIds" | "assistantAdminIds">,
  actorId: string,
  actorIsSiteAdmin: boolean,
) {
  if (actorIsSiteAdmin) return;
  if (isGroupAdmin(group, actorId)) return;
  throw new Error("Only group leaders can manage leadership roles.");
}

export function assertCanRemoveGroupMember(
  group: Group,
  actorId: string,
  memberId: string,
  actorIsSiteAdmin: boolean,
) {
  assertCanManageGroupMembers(group, actorId, actorIsSiteAdmin);

  if (!isGroupMember(group, memberId)) {
    throw new Error("That member is not in this group.");
  }

  if (isGroupAdmin(group, memberId) || isGroupAssistantLeader(group, memberId)) {
    if (!actorIsSiteAdmin && !isGroupAdmin(group, actorId)) {
      throw new Error("Only group leaders can remove someone with a leadership role.");
    }
  }

  if (isGroupAdmin(group, memberId)) {
    assertAnotherAdminRemains(group, memberId);
  }
}
