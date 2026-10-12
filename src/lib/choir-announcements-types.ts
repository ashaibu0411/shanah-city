export type ChoirAnnouncementCategory = "general" | "urgent" | "rehearsal" | "service" | "training";

export type ChoirMinistryAnnouncement = {
  id: string;
  groupId: string;
  title: string;
  body: string;
  authorId: string;
  authorName: string;
  createdAt: string;
  category?: ChoirAnnouncementCategory;
  pinned?: boolean;
  imagePath?: string;
};

export type ChoirAnnouncementFeedItem = {
  id: string;
  title: string;
  authorName: string;
  excerpt: string;
  body: string;
  createdAt: string;
  detailHref: string;
  category: ChoirAnnouncementCategory;
  pinned: boolean;
  imagePath?: string;
  isSample?: boolean;
};

export type ChoirAnnouncementsPagePayload = {
  announcements: ChoirAnnouncementFeedItem[];
  canManage: boolean;
  groupName: string;
};
