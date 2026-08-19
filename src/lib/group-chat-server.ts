import { useDatabase } from "@/lib/use-database";
import { getGroupDetail } from "@/lib/group-server";
import * as groupChatDb from "@/lib/stores/group-chat-db";
import * as groupChatJson from "@/lib/stores/group-chat-json";

const store = () => (useDatabase() ? groupChatDb : groupChatJson);

export async function canAccessGroupChat(groupId: string, userId: string) {
  const detail = await getGroupDetail(groupId, userId);
  if (!detail) return { allowed: false as const, detail: null };
  if (!detail.isMember) {
    return { allowed: false as const, detail };
  }
  return { allowed: true as const, detail };
}

export const listGroupChatMessages = (groupId: string, options?: { after?: string }) =>
  store().listGroupChatMessages(groupId, options);

export const sendGroupChatMessage = (
  input: Parameters<typeof groupChatJson.addGroupChatMessage>[0],
) => store().addGroupChatMessage(input);

export const deleteGroupChatMessagesForGroup = (groupId: string) =>
  store().deleteGroupChatMessagesForGroup(groupId);
