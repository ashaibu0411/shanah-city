import type { GroupCategory } from "@/lib/group-types";

export type ChoirAssignmentView = {
  planKey: string;
  serviceDate: string;
  serviceTime: string;
  title: string;
  dateTimeLabel: string;
  location: string;
  roleLabel: string | null;
  songCount: number;
  worshipHref: string;
  isPersonal: boolean;
};

export type ChoirRehearsalView = {
  id: string;
  title: string;
  dateLabel: string;
  timeLabel: string;
  location: string;
  notes?: string;
  source: "worship-plan" | "group-event" | "default-weekly";
  calendarHref: string;
};

export type ChoirAnnouncementView = {
  id: string;
  title: string;
  authorName: string;
  excerpt: string;
  createdAt: string;
  detailHref: string;
  isSample?: boolean;
};

export type ChoirPinnedLeadershipAnnouncement = {
  id: string;
  title: string;
  excerpt: string;
  authorName: string;
  createdAt: string;
  detailHref: string;
};

export type ChoirHomeChatContext = {
  groupId: string;
  groupName: string;
  groupCategory: GroupCategory;
  groupIconUrl?: string;
  groupUpdatedAt: string;
  userId: string;
  memberCount: number;
  participants: {
    id: string;
    name: string;
    isLeader: boolean;
    subtitle?: string;
  }[];
};

export type ChoirHomeDashboard = {
  assignment: ChoirAssignmentView | null;
  upcomingServicePreview: ChoirAssignmentView | null;
  rehearsal: ChoirRehearsalView | null;
  announcements: ChoirAnnouncementView[];
  pinnedLeadershipAnnouncement: ChoirPinnedLeadershipAnnouncement | null;
  chatContext: ChoirHomeChatContext | null;
  teamConnectChatHref: string;
  chatUnreadCount: number;
  canAccessTeamChat: boolean;
  preparationPlanKey: string | null;
  preparationChecked: string[];
  canManageSchedule: boolean;
  canManageWorship: boolean;
  rehearsalRoomHref: string | null;
};
