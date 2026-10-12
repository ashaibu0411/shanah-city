import type { ChoirAnnouncementFeedItem } from "@/lib/choir-announcements-types";
import type { PollView } from "@/lib/poll-types";
import type { GroupCategory } from "@/lib/group-types";

export type ChoirConnectTabId = "home" | "chat" | "announcements" | "polls";

export type ChoirConnectChatPreview = {
  senderName: string;
  body: string;
  createdAt: string;
  unreadCount: number;
  openChatHref: string;
};

export type ChoirConnectPinnedItem = {
  id: string;
  title: string;
  subtitle: string;
  href: string;
  imagePath?: string;
};

export type ChoirConnectGroupChatContext = {
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

export type ChoirConnectHomePayload = {
  groupId: string;
  groupName: string;
  groupChatHref: string;
  connectHref: string;
  announcementsHref: string;
  pollsHref: string;
  pinnedHref: string;
  chatPreview: ChoirConnectChatPreview | null;
  announcements: ChoirAnnouncementFeedItem[];
  pinned: ChoirConnectPinnedItem[];
  polls: PollView[];
  canManageCommunication: boolean;
  manageAnnouncementsHref: string;
  chatContext: ChoirConnectGroupChatContext;
};
