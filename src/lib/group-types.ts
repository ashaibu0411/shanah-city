export type GroupCategory =
  | "ministry"
  | "choir"
  | "small-group"
  | "youth"
  | "other";

export type GroupVisibility = "public" | "private";

export type Group = {
  id: string;
  name: string;
  description: string;
  category: GroupCategory;
  campusId?: string;
  createdBy: string;
  creatorName: string;
  createdAt: string;
  updatedAt: string;
  visibility: GroupVisibility;
  memberIds: string[];
  adminIds: string[];
  requiresApproval?: boolean;
  isSystem?: boolean;
  signupVisible?: boolean;
  meetingSchedule?: string;
  meetingLink?: string;
};

export type GroupJoinRequest = {
  id: string;
  groupId: string;
  groupName: string;
  userId: string;
  userName: string;
  userEmail: string;
  status: "pending" | "approved" | "rejected";
  requestedAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  reviewedByName?: string;
};

export type SignupGroupOption = {
  id: string;
  name: string;
  description: string;
  category: GroupCategory;
  requiresApproval: boolean;
};

export type GroupMemberPreview = {
  id: string;
  name: string;
  campusId: string;
  isAdmin: boolean;
  isCreator: boolean;
};

export type GroupSummary = Group & {
  memberCount: number;
  isMember: boolean;
  isAdmin: boolean;
};

export type GroupDetail = GroupSummary & {
  members: GroupMemberPreview[];
};

export const groupCategoryLabels: Record<GroupCategory, string> = {
  ministry: "Ministry",
  choir: "Choir & Worship",
  "small-group": "Small Group",
  youth: "Youth & Kids",
  other: "Other",
};
