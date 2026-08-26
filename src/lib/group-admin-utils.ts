import type { Group } from "@/lib/group-types";

export function getAssistantAdminIds(group: Pick<Group, "assistantAdminIds">) {
  return group.assistantAdminIds ?? [];
}

export function isGroupAdmin(group: Pick<Group, "adminIds">, userId: string) {
  return group.adminIds.includes(userId);
}

export function isGroupAssistantLeader(
  group: Pick<Group, "adminIds" | "assistantAdminIds">,
  userId: string,
) {
  if (isGroupAdmin(group, userId)) return false;
  return getAssistantAdminIds(group).includes(userId);
}

export function isGroupLeaderOrAssistant(
  group: Pick<Group, "adminIds" | "assistantAdminIds">,
  userId: string,
) {
  return isGroupAdmin(group, userId) || isGroupAssistantLeader(group, userId);
}

export function isGroupMember(group: Pick<Group, "memberIds">, userId: string) {
  return group.memberIds.includes(userId);
}

export function assertGroupAdmin(group: Pick<Group, "adminIds">, userId: string) {
  if (!isGroupAdmin(group, userId)) {
    throw new Error("Only group leaders can do that.");
  }
}

export function remainingAdminCount(group: Pick<Group, "adminIds">, excludeUserId: string) {
  return group.adminIds.filter((id) => id !== excludeUserId).length;
}

export function assertAnotherAdminRemains(group: Pick<Group, "adminIds">, targetUserId: string) {
  if (remainingAdminCount(group, targetUserId) < 1) {
    throw new Error("Promote another group leader before removing or demoting this one.");
  }
}
