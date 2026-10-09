import { SHANAH_POWER_COUPLES_GROUP_ID } from "@/lib/church-groups";
import type { CommunityFeedFilter } from "@/lib/community-ui-utils";

export const COUPLES_COMMUNITY_GROUP_ID = SHANAH_POWER_COUPLES_GROUP_ID;

export type CouplesCommunityFeedMode = "discussions" | "prayer" | "announcements";

export function couplesCommunityFeedFilter(mode: CouplesCommunityFeedMode): CommunityFeedFilter {
  if (mode === "prayer") return "prayer";
  if (mode === "announcements") return "announcement";
  return "all";
}
