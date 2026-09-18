import { getBlockedUserIds } from "@/lib/block-server";
import { getGroupDetail, getGroups } from "@/lib/group-server";
import { isMemberTrainingRequired } from "@/lib/ministry-readiness-server";

/** Members who should receive group activity alerts (chat, polls, rosters, etc.). */
export async function resolveGroupChatNotificationRecipientIds(
  groupId: string,
  senderId: string,
): Promise<string[]> {
  const groups = await getGroups();
  const group = groups.find((entry) => entry.id === groupId);
  if (!group) return [];

  const candidateIds = [
    ...new Set([...group.memberIds, ...group.adminIds, ...(group.assistantAdminIds ?? [])]),
  ].filter((memberId) => memberId !== senderId);

  if (candidateIds.length === 0) return [];

  const groupDetail = await getGroupDetail(groupId);
  const eligible: string[] = [];

  await Promise.all(
    candidateIds.map(async (userId) => {
      if (!group.memberIds.includes(userId)) {
        return;
      }
      const blocked = await getBlockedUserIds(userId);
      if (blocked.includes(senderId)) {
        return;
      }
      if (groupDetail) {
        const trainingPending = await isMemberTrainingRequired(userId, groupDetail);
        if (trainingPending) {
          return;
        }
      }
      eligible.push(userId);
    }),
  );

  return eligible;
}
