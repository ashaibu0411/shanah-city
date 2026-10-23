"use client";

import { PendingRsvpHomeBanner } from "@/components/home/PendingRsvpHomeBanner";
import {
  AnniversaryHomeBanner,
  CheckInHomeBanner,
  FollowUpHomeBanner,
  LeaderReportHomeBanner,
  TrainingHomeBanner,
} from "@/components/home/DailyEngagementBanners";
import { PrayerHomeBanner } from "@/components/meetings/PrayerHomeBanner";

type PremiumEngagementRailProps = {
  variant?: "desktop" | "mobile";
  includeCheckIn?: boolean;
};

/** Role-aware reminders — preserved from legacy home, premium spacing. */
export function PremiumEngagementRail({
  variant = "desktop",
  includeCheckIn = false,
}: PremiumEngagementRailProps) {
  const mobile = variant === "mobile";

  return (
    <div className="premium-engagement-rail" role="region" aria-label="Reminders">
      <PendingRsvpHomeBanner />
      <AnniversaryHomeBanner />
      <PrayerHomeBanner variant={mobile ? "mobile" : "desktop"} />
      <LeaderReportHomeBanner />
      <TrainingHomeBanner />
      <FollowUpHomeBanner />
      {includeCheckIn ? <CheckInHomeBanner /> : null}
    </div>
  );
}
