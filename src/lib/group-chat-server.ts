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

export const listGroupChatMessages = (
  groupId: string,
  options?: Parameters<typeof groupChatJson.listGroupChatMessages>[1],
) => store().listGroupChatMessages(groupId, options);

export const sendGroupChatMessage = (
  input: Parameters<typeof groupChatJson.addGroupChatMessage>[0],
) => store().addGroupChatMessage(input);

export const editGroupChatMessage = (
  input: Parameters<typeof groupChatJson.editGroupChatMessage>[0],
) => store().editGroupChatMessage(input);

export const deleteGroupChatMessage = (
  input: Parameters<typeof groupChatJson.deleteGroupChatMessage>[0],
) => store().deleteGroupChatMessage(input);

export const markGroupChatRead = (groupId: string, userId: string) =>
  store().markGroupChatRead(groupId, userId);

export const toggleGroupChatReaction = (
  input: Parameters<typeof groupChatJson.toggleGroupChatReaction>[0],
) => store().toggleGroupChatReaction(input);

export const deleteGroupChatMessagesForGroup = (groupId: string) =>
  store().deleteGroupChatMessagesForGroup(groupId);
