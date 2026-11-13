"use client";

import Link from "next/link";
import { useApp } from "@/components/app/AppProvider";
import { useAuth } from "@/components/auth/AuthProvider";
import { UrgentNewsHomeStrip } from "@/components/home/UrgentNewsHomeStrip";
import { PremiumStoriesSection } from "@/components/home/premium/PremiumStoriesSection";
import { CheckInHomeBanner } from "@/components/home/DailyEngagementBanners";
import { PremiumHomeV3Chrome } from "@/components/home/premium/v3/PremiumHomeV3Chrome";
import { PremiumHomeV4Hero } from "@/components/home/premium/v4/PremiumHomeV4Hero";
import { PremiumHomeV3QuickTiles } from "@/components/home/premium/v3/PremiumHomeV3QuickTiles";
import { PremiumHomeV4GiveBar } from "@/components/home/premium/v4/PremiumHomeV4GiveBar";
import { PremiumHomeV4UpcomingEvents } from "@/components/home/premium/v4/PremiumHomeV4UpcomingEvents";
import { PremiumHomeV4LatestSermon } from "@/components/home/premium/v4/PremiumHomeV4LatestSermon";
import { getPublicDisplayFirstName } from "@/lib/member-display-name";
import type { ChurchSocialImages } from "@/lib/facebook-church-media";
import type { HomeUpcomingEventRow } from "@/lib/home-upcoming-events";
import type { SermonVideo } from "@/lib/youtube-sermons-server";
import type { UrgentAlert } from "@/lib/urgent-alert-types";

type PremiumHomeMobileProps = {
  urgentAlerts: UrgentAlert[];
  highlightAlertId?: string | null;
  churchImages: ChurchSocialImages;
  latestSermon: SermonVideo | null;
  upcomingEventRows: HomeUpcomingEventRow[];
};

export function PremiumHomeMobile({
  urgentAlerts,
  highlightAlertId = null,
  churchImages: _churchImages,
  latestSermon,
  upcomingEventRows,
}: PremiumHomeMobileProps) {
  const { campus } = useApp();
  const { user } = useAuth();
  const firstName = user ? getPublicDisplayFirstName(user) : null;

  return (
    <>
      <PremiumHomeV3Chrome />
      <div className="premium-home-v3 premium-home-v4 animate-fade-in">
        <PremiumStoriesSection
          sectionTitle="Stories"
          storiesPresentation="v6"
          homeV3
        />

        <PremiumHomeV4Hero firstName={firstName} campusLabel={campus.city} editorial heroV3 />

        <PremiumHomeV3QuickTiles />
        <PremiumHomeV4GiveBar />
        <PremiumHomeV4UpcomingEvents rows={upcomingEventRows} />
        <PremiumHomeV4LatestSermon video={latestSermon} />

        {urgentAlerts.length > 0 ? (
          <UrgentNewsHomeStrip
            alerts={urgentAlerts}
            variant="mobile"
            highlightAlertId={highlightAlertId}
          />
        ) : null}

        <CheckInHomeBanner />

        <Link href="/guest" className="premium-guest-cta">
          <span>First time here?</span>
          <span className="premium-guest-cta__pill">Connect</span>
        </Link>
      </div>
    </>
  );
}
