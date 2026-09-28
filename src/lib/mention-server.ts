import { getUsers, toPublicMember } from "@/lib/auth-server";
import { getPublicDisplayName } from "@/lib/member-display-name";
import { getGroups } from "@/lib/group-server";
import { getMemberDirectory } from "@/lib/message-server";
import type { MentionMember } from "@/lib/mentions";

export async function getMentionableMembers(input: {
  currentUserId: string;
  groupId?: string;
}): Promise<MentionMember[]> {
  if (input.groupId) {
    const groups = await getGroups();
    const group = groups.find((entry) => entry.id === input.groupId);
    if (!group) return [];

    const users = await getUsers();
    const byId = new Map(users.map((user) => [user.id, user] as const));
    const members: MentionMember[] = [];

    for (const memberId of group.memberIds) {
      if (memberId === input.currentUserId) continue;
      const user = byId.get(memberId);
      if (!user) continue;
      const publicUser = toPublicMember(user);
      members.push({
        id: publicUser.id,
        name: getPublicDisplayName(publicUser),
      });
    }

    return members.sort((a, b) => a.name.localeCompare(b.name));
  }

  const directory = await getMemberDirectory(input.currentUserId);
  return directory.map((entry) => ({
    id: entry.id,
    name: entry.name,
  }));
}

export async function getAllMemberIdsForMentionAll(excludeUserId?: string) {
  const users = await getUsers();
  return users
    .map((user) => user.id)
    .filter((id) => id !== excludeUserId);
}

export async function getGroupMemberIds(groupId: string, excludeUserId?: string) {
  const groups = await getGroups();
  const group = groups.find((entry) => entry.id === groupId);
  if (!group) return [];
  return group.memberIds.filter((id) => id !== excludeUserId);
}
