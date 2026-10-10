import { SHANAH_POWER_COUPLES_GROUP_ID } from "@/lib/church-groups";
import type { CouplesHubCommunityTileId } from "@/lib/couples-hub-types";

const GROUP_PATH = `/groups/${SHANAH_POWER_COUPLES_GROUP_ID}`;

/** Power Couples routes render their own midnight header (avatar + notifications). */
export function couplesUsesDedicatedMobileChrome(pathname: string): boolean {
  if (!pathname) return false;
  if (pathname === GROUP_PATH || pathname.startsWith(`${GROUP_PATH}/`)) return true;
  if (pathname === "/couples" || pathname.startsWith("/couples/")) return true;
  return false;
}

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
  | "community-discussions"
  | "community-prayer"
  | "community-announcements"
  | "devotions";

export function communityTileTarget(
  tileId: CouplesHubCommunityTileId,
): PowerCouplesCommunitySection | "overview" {
  switch (tileId) {
    case "discussions":
      return "community-discussions";
    case "events":
      return "calendar";
    case "prayer":
      return "community-prayer";
    case "resources":
      return "resources";
    case "challenges":
      return "growth";
    case "devotionals":
      return "devotions";
    case "announcements":
      return "community-announcements";
    default:
      return "overview";
  }
}
