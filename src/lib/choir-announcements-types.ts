export type ChoirMinistryAnnouncement = {
  id: string;
  groupId: string;
  title: string;
  body: string;
  authorId: string;
  authorName: string;
  createdAt: string;
};

export type ChoirAnnouncementFeedItem = {
  id: string;
  title: string;
  authorName: string;
  excerpt: string;
  body: string;
  createdAt: string;
  detailHref: string;
  isSample?: boolean;
};

export type ChoirAnnouncementsPagePayload = {
  announcements: ChoirAnnouncementFeedItem[];
  canManage: boolean;
  groupName: string;
};
