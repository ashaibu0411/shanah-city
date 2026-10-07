import { YOUNG_ADULTS_GROUP_ID } from "@/lib/church-groups";

export { YOUNG_ADULTS_GROUP_ID };

/** Groups with dashboard hub, prayer wall, and pinned announcements (v1). */
export const MINISTRY_HUB_GROUP_IDS = new Set<string>([YOUNG_ADULTS_GROUP_ID]);

export function groupHasMinistryHub(groupId: string) {
  return MINISTRY_HUB_GROUP_IDS.has(groupId);
}

export type GroupPinnedAnnouncement = {
  groupId: string;
  title: string;
  body: string;
  updatedAt: string;
  updatedBy?: string;
  updatedByName?: string;
};

export type GroupMinistryPrayerPost = {
  id: string;
  groupId: string;
  authorId: string;
  authorName: string;
  content: string;
  type: "prayer" | "praise";
  createdAt: string;
};

export type MinistryHubDevotionPreview = {
  id: string;
  title: string;
  verse: string;
  href: string;
};

export type MinistryHubEventPreview = {
  title: string;
  subtitle: string;
  href: string;
};

export type MinistryHubBibleStudy = {
  groupId: string;
  leaderUserId?: string;
  leaderName: string;
  topic: string;
  bibleBook: string;
  meetingWeekday: number;
  meetingTime?: string;
  reminder1Hour: number;
  reminder1Minute: number;
  reminder2Hour: number;
  reminder2Minute: number;
  lastReminder1DateKey?: string;
  lastReminder2DateKey?: string;
  updatedAt: string;
};

export type MinistryHubBiblePlanDay = {
  day: number;
  title: string;
  passage: string;
};

export type MinistryHubBiblePlan = {
  id: string;
  groupId: string;
  title: string;
  days: MinistryHubBiblePlanDay[];
  active: boolean;
  createdAt: string;
};

export type MinistryHubFaithChallenge = {
  id: string;
  groupId: string;
  title: string;
  body: string;
  weekStart: string;
  active: boolean;
  createdAt: string;
};

export type MinistryHubEngagementSnapshot = {
  memberCount: number;
  prayerPraiseLast7Days: number;
  activePollCount: number;
  pollVotersLast7Days: number;
  challengeCheckInsThisWeek: number;
};

export const DEFAULT_MONDAY_BIBLE_STUDY_REMINDERS = {
  reminder1Hour: 9,
  reminder1Minute: 0,
  reminder2Hour: 17,
  reminder2Minute: 0,
} as const;
