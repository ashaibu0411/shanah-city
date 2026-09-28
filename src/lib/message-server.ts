import { useDatabase } from "@/lib/use-database";
import * as messageDb from "@/lib/stores/message-db";
import * as messageJson from "@/lib/stores/message-json";
import type { MessageThread } from "@/lib/member-types";
import {
  applyDisplayNamesToDirectMessage,
  applyDisplayNamesToThread,
  buildPublicDisplayNameMap,
  collectDirectMessageUserIds,
} from "@/lib/member-display-name-server";

const store = () => (useDatabase() ? messageDb : messageJson);

export const getMemberDirectory = (currentUserId: string) =>
  store().getMemberDirectory(currentUserId);

export async function getThreadsForUser(userId: string) {
  const threads = await store().getThreadsForUser(userId);
  const nameById = await buildPublicDisplayNameMap(threads.flatMap((thread) => thread.participantIds));
  return threads.map((thread) => applyDisplayNamesToThread(thread, nameById));
}

export async function getMessagesForThread(threadId: string, userId: string) {
  const result = await store().getMessagesForThread(threadId, userId);
  if (!result) return null;

  const nameById = await buildPublicDisplayNameMap(
    collectDirectMessageUserIds(result.messages, result.thread),
  );

  return {
    thread: applyDisplayNamesToThread(result.thread, nameById),
    messages: result.messages.map((message) =>
      applyDisplayNamesToDirectMessage(message, nameById),
    ),
  };
}

export const markThreadRead = (threadId: string, userId: string) =>
  store().markThreadRead(threadId, userId);
export const sendDirectMessage = (
  input: Parameters<typeof messageJson.sendDirectMessage>[0],
) => store().sendDirectMessage(input);
export const editDirectMessage = (
  input: Parameters<typeof messageJson.editDirectMessage>[0],
) => store().editDirectMessage(input);
export const deleteDirectMessage = (
  input: Parameters<typeof messageJson.deleteDirectMessage>[0],
) => store().deleteDirectMessage(input);
export const setDirectThreadDisappearing = (
  input: Parameters<typeof messageJson.setDirectThreadDisappearing>[0],
) => store().setDirectThreadDisappearing(input);
export const clearDirectThreadMessages = (
  input: Parameters<typeof messageJson.clearDirectThreadMessages>[0],
) => store().clearDirectThreadMessages(input);
export const toggleDirectMessageReaction = (
  input: Parameters<typeof messageJson.toggleDirectMessageReaction>[0],
) => store().toggleDirectMessageReaction(input);
export const getOtherParticipant = (thread: MessageThread, userId: string) =>
  store().getOtherParticipant(thread, userId);
export const getOtherParticipantId = (thread: MessageThread, userId: string) =>
  store().getOtherParticipantId(thread, userId);
