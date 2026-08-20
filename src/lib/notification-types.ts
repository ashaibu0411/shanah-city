export type FeedReadKey =
  | "community"
  | "devotions"
  | "media"
  | "worship"
  | "meetings"
  | "kids";

export type AppNotificationItemType =
  | "direct_message"
  | "group_chat"
  | "community"
  | "devotion"
  | "media"
  | "worship"
  | "meeting"
  | "kids";

export type AppNotificationItem = {
  id: string;
  type: AppNotificationItemType;
  title: string;
  body: string;
  href: string;
  count: number;
  at: string;
};

export type AppNotificationsSummary = {
  total: number;
  directMessages: number;
  groupChat: number;
  community: number;
  devotions: number;
  media: number;
  worship: number;
  meetings: number;
  kids: number;
  items: AppNotificationItem[];
};

export const FEED_READ_KEYS: FeedReadKey[] = [
  "community",
  "devotions",
  "media",
  "worship",
  "meetings",
  "kids",
];
