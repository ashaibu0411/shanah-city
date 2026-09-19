/** Snapshot of the message being replied to (stored on the new message). */
export type ChatMessageReply = {
  messageId: string;
  senderId: string;
  senderName: string;
  excerpt: string;
};

export type ChatReplyDraft = ChatMessageReply;
