import { getGroups } from "@/lib/group-server";
import { isGroupAdmin, isGroupMember } from "@/lib/group-admin-utils";
import { getThreadsForUser } from "@/lib/message-server";

/** People in your groups and DM threads — “your people” for story ordering and alerts. */
export async function getStoryCircleUserIds(userId: string): Promise<string[]> {
  const [groups, threads] = await Promise.all([getGroups(), getThreadsForUser(userId)]);
  const ids = new Set<string>();

  for (const group of groups) {
    if (!isGroupMember(group, userId) && !isGroupAdmin(group, userId)) {
      continue;
    }
    for (const memberId of group.memberIds) {
      if (memberId !== userId) ids.add(memberId);
    }
    for (const adminId of group.adminIds) {
      if (adminId !== userId) ids.add(adminId);
    }
    for (const assistantId of group.assistantAdminIds ?? []) {
      if (assistantId !== userId) ids.add(assistantId);
    }
  }

  for (const thread of threads) {
    const otherId = thread.participantIds.find((id) => id !== userId);
    if (otherId) ids.add(otherId);
  }

  return [...ids];
}
