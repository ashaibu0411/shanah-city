import { SHANAH_POWER_COUPLES_GROUP_ID } from "@/lib/church-groups";
import type { CouplesHubCommunityTileId } from "@/lib/couples-hub-types";

const GROUP_PATH = `/groups/${SHANAH_POWER_COUPLES_GROUP_ID}`;

/** Canonical entry for the Couples Hub experience (Power Couples group home). */
export function powerCouplesGroupHubPath() {
  return GROUP_PATH;
}

export function powerCouplesGroupSectionPath(
  section: "calendar" | "resources" | "prayer" | "mentors" | "growth" | "chat" | "info" | "polls",
) {
  return `${GROUP_PATH}?${section}=1`;
}

export type PowerCouplesCommunitySection =
  | "calendar"
  | "resources"
  | "prayer"
  | "mentors"
  | "growth"
  | "chat"
  | "info"
  | "community-feed"
  | "devotions";

export function communityTileTarget(
  tileId: CouplesHubCommunityTileId,
): PowerCouplesCommunitySection | "overview" {
  switch (tileId) {
    case "discussions":
      return "community-feed";
    case "events":
      return "calendar";
    case "prayer":
      return "prayer";
    case "resources":
      return "resources";
    case "challenges":
      return "growth";
    case "devotionals":
      return "devotions";
    case "announcements":
      return "info";
    default:
      return "overview";
  }
}
