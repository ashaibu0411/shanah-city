export type UserBlock = {
  id: string;
  blockerId: string;
  blockedUserId: string;
  blockedUserName: string;
  createdAt: string;
};

export type MessageReport = {
  id: string;
  reporterId: string;
  reporterName: string;
  reportedUserId: string;
  reportedUserName: string;
  threadId?: string;
  groupId?: string;
  messageId?: string;
  reason: string;
  createdAt: string;
  status: "open" | "reviewed";
};
