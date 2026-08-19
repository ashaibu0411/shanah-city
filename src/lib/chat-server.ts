import { useDatabase } from "@/lib/use-database";
import * as chatAttachmentDb from "@/lib/stores/chat-attachment-db";
import * as chatAttachmentJson from "@/lib/stores/chat-attachment-json";
import * as chatTypingDb from "@/lib/stores/chat-typing-db";
import * as chatTypingJson from "@/lib/stores/chat-typing-json";

const attachmentStore = () => (useDatabase() ? chatAttachmentDb : chatAttachmentJson);
const typingStore = () => (useDatabase() ? chatTypingDb : chatTypingJson);

export const saveChatAttachment = (
  input: Parameters<typeof chatAttachmentJson.saveChatAttachment>[0],
) => attachmentStore().saveChatAttachment(input);

export const getChatAttachmentRecord = (id: string) =>
  attachmentStore().getChatAttachmentRecord(id);

export const readChatAttachmentFile = (id: string) =>
  attachmentStore().readChatAttachmentFile(id);

export const setChatTyping = (input: Parameters<typeof chatTypingJson.setChatTyping>[0]) =>
  typingStore().setChatTyping(input);

export const getChatTypingUsers = (
  input: Parameters<typeof chatTypingJson.getChatTypingUsers>[0],
) => typingStore().getChatTypingUsers(input);
