import { getGroups } from "@/lib/group-server";
import { isGroupLeaderOrAssistant, isGroupMember } from "@/lib/group-admin-utils";
import { groupStoryAuthorId } from "@/lib/group-community-story-ids";
import type { Group } from "@/lib/group-types";

export { groupStoryAuthorId, parseGroupStoryAuthorId, GROUP_STORY_AUTHOR_PREFIX } from "@/lib/group-community-story-ids";

/** Group leaders and assistants may post to the community story ring for their group. */
export function canPostGroupCommunityStory(
  group: Pick<Group, "adminIds" | "assistantAdminIds">,
  userId: string,
) {
  return isGroupLeaderOrAssistant(group, userId);
}

export async function getGroupById(groupId: string) {
  const groups = await getGroups();
  return groups.find((entry) => entry.id === groupId) ?? null;
}

export async function assertCanPostGroupCommunityStory(userId: string, groupId: string) {
  const group = await getGroupById(groupId);
  if (!group) {
    throw new Error("Group not found.");
  }
  if (!canPostGroupCommunityStory(group, userId)) {
    throw new Error("Only group leaders and assistants can share stories for this group.");
  }
  return group;
}

export async function listGroupsUserCanPostCommunityStories(userId: string) {
  const groups = await getGroups();
  return groups
    .filter((group) => canPostGroupCommunityStory(group, userId))
    .map((group) => ({
      id: group.id,
      name: group.name,
      category: group.category,
      iconUrl: group.iconUrl,
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

export async function canDeleteGroupCommunityStatus(userId: string, groupId: string) {
  const group = await getGroupById(groupId);
  if (!group) return false;
  return canPostGroupCommunityStory(group, userId);
}

/** Boost group story rings for members of that group. */
export async function getGroupStoryPriorityAuthorIds(userId: string): Promise<string[]> {
  const groups = await getGroups();
  const ids: string[] = [];
  for (const group of groups) {
    if (isGroupMember(group, userId) || isGroupLeaderOrAssistant(group, userId)) {
      ids.push(groupStoryAuthorId(group.id));
    }
  }
  return ids;
}

export async function getGroupMemberIdsForStoryNotify(groupId: string): Promise<string[]> {
  const group = await getGroupById(groupId);
  if (!group) return [];
  const ids = new Set<string>();
  for (const memberId of group.memberIds) ids.add(memberId);
  for (const adminId of group.adminIds) ids.add(adminId);
  for (const assistantId of group.assistantAdminIds ?? []) ids.add(assistantId);
  return [...ids];
}
