import { listGroupChatMessages, sendGroupChatMessage } from "@/lib/group-chat-server";
import { buildPollGroupChatContent, extractPollIdFromChatContent } from "@/lib/poll-chat-links";
import { notifyGroupChatMessage } from "@/lib/push-server";

export async function groupChatHasPollAnnouncement(groupId: string, pollId: string) {
  const messages = await listGroupChatMessages(groupId);
  return messages.some((message) => extractPollIdFromChatContent(message.content) === pollId);
}

/** Posts a poll announcement into group chat and notifies members (inbox + push). */
export async function announcePollInGroupChat(input: {
  groupId: string;
  groupName: string;
  pollId: string;
  question: string;
  authorId: string;
  authorName: string;
}) {
  const content = buildPollGroupChatContent(input.pollId, input.question);

  await sendGroupChatMessage({
    groupId: input.groupId,
    groupName: input.groupName,
    senderId: input.authorId,
    senderName: input.authorName,
    content,
  });

  await notifyGroupChatMessage({
    groupId: input.groupId,
    groupName: input.groupName,
    senderId: input.authorId,
    senderName: input.authorName,
    preview: `📊 ${input.question.slice(0, 110)}`,
  });
}
