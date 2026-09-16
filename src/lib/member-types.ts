export type Comment = {
  id: string;
  author: string;
  content: string;
  createdAt: string;
};

export type CommunityPostMediaItem = {
  url: string;
  type: "image" | "video";
};

export type CommunityPost = {
  id: string;
  author: string;
  authorId?: string;
  campusId: string;
  content: string;
  mediaUrl?: string;
  mediaType?: "image" | "video";
  mediaItems?: CommunityPostMediaItem[];
  timeAgo: string;
  type: "prayer" | "praise" | "general" | "announcement";
  reactions: number;
  reactionCounts?: import("@/lib/community-post-reactions").CommunityPostReactionCounts;
  viewerReactions?: import("@/lib/community-post-reactions").CommunityPostReactionKind[];
  targetGroupId?: string;
  targetGroupName?: string;
  comments: Comment[];
  createdAt?: string;
  /** Set when loading posts for the signed-in viewer; not stored in the database. */
  canManage?: boolean;
};

export type CommunityStatusReactionCounts = import("@/lib/community-story-reactions").CommunityStatusReactionCounts;

export type CommunityStoryReactionKind = import("@/lib/community-story-reactions").CommunityStoryReactionKind;

export type CommunityStatusMediaType = "image" | "video" | "text" | "link" | "audio" | "live";

export type CommunityStatusStoryKind = "default" | "service_invite";

export type CommunityStatus = {
  id: string;
  authorId: string;
  authorName: string;
  mediaUrl: string;
  mediaType: CommunityStatusMediaType;
  caption?: string;
  storyKind?: CommunityStatusStoryKind;
  createdAt: string;
  expiresAt: string;
  reactions?: CommunityStatusReactionCounts;
  viewerReactions?: CommunityStoryReactionKind[];
};

export type AdminPeopleGroupStatus = {
  id: string;
  name: string;
  status: "member" | "pending";
};

export type AdminPeopleFamilyMember = {
  id: string;
  name: string;
  relationship: string;
  birthYear?: string;
  notes?: string;
  allergies?: string;
  medicalNotes?: string;
  authorizedPickup?: import("@/lib/kids-types").AuthorizedPickupContact[];
};

export type AdminPeopleEntry = {
  id: string;
  name: string;
  email: string;
  phone?: string;
  campusId: string;
  role?: string;
  pastoralRole?: "senior_pastor" | "associate_pastor" | null;
  createdAt: string;
  familyCount: number;
  family: AdminPeopleFamilyMember[];
  groups: AdminPeopleGroupStatus[];
};

export type VolunteerCheckIn = {
  id: string;
  name: string;
  ministry: string;
  checkedInAt: string;
  atChurch: boolean;
  distanceMeters: number;
};

export type KidCheckIn = {
  id: string;
  parentName: string;
  parentUserId?: string;
  familyMemberId?: string;
  childName: string;
  ageGroup: string;
  service: string;
  notes?: string;
  allergies?: string;
  medicalNotes?: string;
  authorizedPickup?: import("@/lib/kids-types").AuthorizedPickupContact[];
  securityCode: string;
  checkedInAt: string;
  checkedOutAt?: string;
  checkedOutBy?: string;
  pickupVerified?: boolean;
  pickupVerifiedAt?: string;
};

export type ChurchEvent = {
  id: string;
  title: string;
  date: string;
  time: string;
  location: string;
  category: "church";
};

export type UnavailabilityRequest = {
  id: string;
  personName: string;
  group: "choir" | "pastors";
  startDate: string;
  endDate: string;
  reason: string;
  status: "pending" | "approved" | "rejected";
  submittedAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
};

export type MessageThread = {
  id: string;
  participantIds: string[];
  participantNames: Record<string, string>;
  isGroup?: boolean;
  lastMessage: string;
  lastMessageAt: string;
  createdAt: string;
};

import type { ChatMessageReaction } from "@/lib/chat-utils";

export type DirectMessage = {
  id: string;
  threadId: string;
  senderId: string;
  senderName: string;
  content: string;
  reactions?: ChatMessageReaction[];
  attachmentUrl?: string;
  attachmentType?: string;
  attachmentName?: string;
  editedAt?: string;
  deletedAt?: string;
  createdAt: string;
  readAt?: string;
};

export type MemberDirectoryEntry = {
  id: string;
  name: string;
  campusId: string;
};
