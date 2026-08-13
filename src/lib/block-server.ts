import { useDatabase } from "@/lib/use-database";
import * as blockDb from "@/lib/stores/block-db";
import * as blockJson from "@/lib/stores/block-json";

const store = () => (useDatabase() ? blockDb : blockJson);

export const getBlocksForUser = (userId: string) => store().getBlocksForUser(userId);
export const getBlockedUserIds = (userId: string) => store().getBlockedUserIds(userId);
export const isUserBlocked = (blockerId: string, blockedUserId: string) =>
  store().isUserBlocked(blockerId, blockedUserId);
export const hasMessagingBlock = (userA: string, userB: string) =>
  store().hasMessagingBlock(userA, userB);
export const getMessagingBlockReason = (senderId: string, recipientId: string) =>
  store().getMessagingBlockReason(senderId, recipientId);
export const blockUser = (input: Parameters<typeof blockJson.blockUser>[0]) =>
  store().blockUser(input);
export const unblockUser = (blockerId: string, blockedUserId: string) =>
  store().unblockUser(blockerId, blockedUserId);
export const reportMember = (input: Parameters<typeof blockJson.reportMember>[0]) =>
  store().reportMember(input);
export const getOpenReportsForLeaders = (limit?: number) =>
  store().getOpenReportsForLeaders(limit);
