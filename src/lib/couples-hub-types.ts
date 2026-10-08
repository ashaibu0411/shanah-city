import { SHANAH_POWER_COUPLES_GROUP_ID } from "@/lib/church-groups";

export const COUPLES_HUB_GROUP_ID = SHANAH_POWER_COUPLES_GROUP_ID;

export type CouplesHubMarriageTileId =
  | "calendar"
  | "date-night"
  | "love-notes"
  | "check-in"
  | "prayer-journal"
  | "goals"
  | "devotionals"
  | "games";

export type CouplesHubCommunityTileId =
  | "announcements"
  | "discussions"
  | "events"
  | "devotionals"
  | "challenges"
  | "prayer"
  | "resources";

export type CouplesHubOverview = {
  hasActiveLink: boolean;
  partnerName?: string;
  anniversaryDate?: string;
  isPowerCouplesMember: boolean;
  pendingIncomingInvite: boolean;
  canManageMarriageMinistry: boolean;
};
