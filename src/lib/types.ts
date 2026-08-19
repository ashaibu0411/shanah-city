export type Campus = {
  id: string;
  name: string;
  city: string;
  country: string;
  timezone: string;
  pastor: string;
  serviceTimes: string[];
  address?: string;
  isLive?: boolean;
};

export type LiveStream = {
  isLive: boolean;
  title: string;
  campusId: string;
  viewerCount: number;
  scheduledAt?: string;
  chatEnabled: boolean;
  youtube: {
    channelUrl: string;
    embedUrl: string;
    videoId?: string;
    isLive: boolean;
  };
  facebook: {
    isLive: boolean;
    shanahCity: {
      pageUrl: string;
      embedUrl: string;
      liveEmbedUrl?: string;
    };
    shanahRevival: {
      pageUrl: string;
      embedUrl: string;
      liveEmbedUrl?: string;
    };
  };
};

export type SocialAccount = {
  name: string;
  url: string;
  handle?: string;
};

export type GivingPlatform = {
  id: string;
  name: string;
  description: string;
  action: "link" | "copy";
  url?: string;
  copyValue?: string;
  copyHint?: string;
  tone: string;
};

export type StreamPreview = {
  id: string;
  platform: string;
  label: string;
  url: string;
  thumbnail: string;
  videoId?: string;
  fallbackThumbnail?: string;
  handle?: string;
  embedUrl?: string;
};

export type MediaClipPlatform = "youtube" | "instagram" | "facebook" | "upload";

export type MediaClip = {
  id: string;
  title: string;
  platform: MediaClipPlatform;
  url: string;
  videoId?: string;
  thumbnail?: string;
  publishedAt?: string;
};

export type MediaTab = "live" | "clips";

export type Devotion = {
  id: string;
  title: string;
  verse: string;
  reference: string;
  readingTime: string;
  content: string;
  prayer: string;
  date: string;
  published?: boolean;
  authorId?: string;
  authorName?: string;
  audioUrl?: string;
  audioName?: string;
  createdAt?: string;
  updatedAt?: string;
  publishAt?: string | null;
  notifiedAt?: string | null;
};

export type ChurchEvent = {
  id: string;
  title: string;
  date: string;
  time: string;
  location: string;
  campusId?: string;
  groupId?: string | null;
  groupName?: string | null;
  startsOn?: string | null;
  endsOn?: string | null;
  recurringWeekday?: number | null;
  published?: boolean;
  sortOrder?: number;
};

export type MeetingPlatform = "in-person" | "zoom" | "teams";

export type Meeting = {
  id: string;
  title: string;
  campusId: string;
  host: string;
  schedule: string;
  platform: MeetingPlatform;
  joinUrl?: string | null;
  location?: string | null;
  meetingId?: string | null;
  passcode?: string | null;
  startsOn?: string | null;
  endsOn?: string | null;
  recurringWeekday?: number | null;
  recurringWeekdays?: number[] | null;
  notifyEnabled?: boolean;
  lastNotifiedOn?: string | null;
  published?: boolean;
  sortOrder?: number;
};

export type ShopProduct = {
  id: string;
  name: string;
  price: number;
  category: string;
  image: string;
  description: string;
  badge?: string;
};

export type CommunityPost = {
  id: string;
  author: string;
  campusId: string;
  content: string;
  timeAgo: string;
  type: "prayer" | "praise" | "announcement";
  reactions: number;
};

export type Leader = {
  name: string;
  role: string;
  ministry?: string;
};

export type QuickAction = {
  label: string;
  href: string;
  icon: string;
  color: string;
};
