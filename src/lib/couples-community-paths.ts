import type { CouplesCommunityFeedMode } from "@/lib/couples-community-constants";
import { powerCouplesGroupHubPath } from "@/lib/couples-hub-paths";

export function couplesCommunityFeedPath(mode: CouplesCommunityFeedMode) {
  return `/couples/community/${mode}`;
}

export function couplesCommunityHubBackPath() {
  return powerCouplesGroupHubPath();
}
