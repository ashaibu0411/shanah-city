export type Comment = {
  id: string;
  author: string;
  content: string;
  createdAt: string;
};

export type CommunityPost = {
  id: string;
  author: string;
  campusId: string;
  content: string;
  timeAgo: string;
  type: "prayer" | "praise" | "announcement";
  reactions: number;
  targetGroupId?: string;
  targetGroupName?: string;
  comments: Comment[];
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
};

export type AdminPeopleEntry = {
  id: string;
  name: string;
  email: string;
  phone?: string;
  campusId: string;
  role?: string;
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
  childName: string;
  ageGroup: string;
  service: string;
  notes?: string;
  securityCode: string;
  checkedInAt: string;
  checkedOutAt?: string;
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
  participantIds: [string, string];
  participantNames: Record<string, string>;
  lastMessage: string;
  lastMessageAt: string;
  createdAt: string;
};

export type DirectMessage = {
  id: string;
  threadId: string;
  senderId: string;
  senderName: string;
  content: string;
  createdAt: string;
  readAt?: string;
};

export type MemberDirectoryEntry = {
  id: string;
  name: string;
  campusId: string;
};
