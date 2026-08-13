import { useDatabase } from "@/lib/use-database";
import * as messageDb from "@/lib/stores/message-db";
import * as messageJson from "@/lib/stores/message-json";
import type { MessageThread } from "@/lib/member-types";

const store = () => (useDatabase() ? messageDb : messageJson);

export const getMemberDirectory = (currentUserId: string) =>
  store().getMemberDirectory(currentUserId);
export const getThreadsForUser = (userId: string) =>
  store().getThreadsForUser(userId);
export const getMessagesForThread = (threadId: string, userId: string) =>
  store().getMessagesForThread(threadId, userId);
export const sendDirectMessage = (
  input: Parameters<typeof messageJson.sendDirectMessage>[0],
) => store().sendDirectMessage(input);
export const getOtherParticipant = (thread: MessageThread, userId: string) =>
  store().getOtherParticipant(thread, userId);
export const getOtherParticipantId = (thread: MessageThread, userId: string) =>
  store().getOtherParticipantId(thread, userId);
