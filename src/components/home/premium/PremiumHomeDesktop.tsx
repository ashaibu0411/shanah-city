"use client";

import { UrgentNewsHomeStrip } from "@/components/home/UrgentNewsHomeStrip";
import { PremiumEngagementRail } from "@/components/home/premium/PremiumEngagementRail";
import { PremiumHomeHero } from "@/components/home/premium/PremiumHomeHero";
import { PremiumQuickActions } from "@/components/home/premium/PremiumQuickActions";
import { PremiumUpcomingEvents } from "@/components/home/premium/PremiumUpcomingEvents";
import { PremiumLivePanel } from "@/components/home/premium/PremiumLivePanel";
import { PremiumStayConnected } from "@/components/home/premium/PremiumStayConnected";
import { PremiumStoriesSection } from "@/components/home/premium/PremiumStoriesSection";
import { PremiumSermonSection } from "@/components/home/premium/PremiumSermonSection";
import { PremiumPrayerGive } from "@/components/home/premium/PremiumPrayerGive";
import { PremiumCampusSection } from "@/components/home/premium/PremiumCampusSection";
import { CheckInHomeBanner } from "@/components/home/DailyEngagementBanners";
import { useAuth } from "@/components/auth/AuthProvider";
import { getPublicDisplayFirstName } from "@/lib/member-display-name";
import type { ChurchSocialImages } from "@/lib/facebook-church-media";
import type { HomeUpcomingEventRow } from "@/lib/home-upcoming-events";
import type { SermonVideo } from "@/lib/youtube-sermons-server";
import type { UrgentAlert } from "@/lib/urgent-alert-types";

type PremiumHomeDesktopProps = {
  urgentAlerts: UrgentAlert[];
  highlightAlertId?: string | null;
  churchImages: ChurchSocialImages;
  latestSermon: SermonVideo | null;
  upcomingEventRows: HomeUpcomingEventRow[];
};

export function PremiumHomeDesktop({
  urgentAlerts,
  highlightAlertId = null,
  churchImages,
  latestSermon,
  upcomingEventRows,
}: PremiumHomeDesktopProps) {
  const { user } = useAuth();
  const firstName = user ? getPublicDisplayFirstName(user) : null;

  return (
    <div className="premium-home premium-home--desktop">
      {urgentAlerts.length > 0 ? (
        <UrgentNewsHomeStrip
          alerts={urgentAlerts}
          highlightAlertId={highlightAlertId}
          variant="desktop"
        />
      ) : null}

      <PremiumEngagementRail variant="desktop" />

      <PremiumHomeHero variant="desktop" firstName={firstName} />

      <PremiumQuickActions />

      <div className="premium-home__split">
        <div className="premium-home__split-main">
          <PremiumUpcomingEvents rows={upcomingEventRows} variant="desktop" />
        </div>
        <div className="premium-home__split-aside">
          <PremiumLivePanel liveFlyerImage={churchImages.live} variant="desktop" />
        </div>
      </div>

      <PremiumStayConnected />

      <PremiumStoriesSection />

      <div className="premium-home__media-row">
        <div className="premium-home__media-main">
          <PremiumSermonSection video={latestSermon} variant="desktop" />
        </div>
        <div className="premium-home__media-aside">
          <PremiumPrayerGive />
        </div>
      </div>

      <PremiumCampusSection />

      <div className="premium-engagement-rail premium-engagement-rail--footer">
        <CheckInHomeBanner />
      </div>
    </div>
  );
}
