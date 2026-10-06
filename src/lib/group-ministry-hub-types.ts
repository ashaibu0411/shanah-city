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
