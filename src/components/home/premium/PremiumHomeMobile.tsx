"use client";

import Link from "next/link";
import { useApp } from "@/components/app/AppProvider";
import { site } from "@/lib/site";
import { useAuth } from "@/components/auth/AuthProvider";
import { UrgentNewsHomeStrip } from "@/components/home/UrgentNewsHomeStrip";
import { PremiumEngagementRail } from "@/components/home/premium/PremiumEngagementRail";
import { PremiumHomeHero } from "@/components/home/premium/PremiumHomeHero";
import { PremiumMobileLauncher } from "@/components/home/premium/PremiumQuickActions";
import { PremiumUpcomingEvents } from "@/components/home/premium/PremiumUpcomingEvents";
import { PremiumMobileLiveCinema } from "@/components/home/premium/PremiumMobileLiveCinema";
import { PremiumStoriesSection } from "@/components/home/premium/PremiumStoriesSection";
import { PremiumSermonSection } from "@/components/home/premium/PremiumSermonSection";
import { PremiumStayConnected } from "@/components/home/premium/PremiumStayConnected";
import { PremiumPrayerGive } from "@/components/home/premium/PremiumPrayerGive";
import { CheckInHomeBanner } from "@/components/home/DailyEngagementBanners";
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
  churchImages,
  latestSermon,
  upcomingEventRows,
}: PremiumHomeMobileProps) {
  const { campus } = useApp();
  const { user } = useAuth();
  const firstName = user ? getPublicDisplayFirstName(user) : null;
  const nextService =
    siteServiceTime();

  return (
    <div className="premium-home premium-home--mobile animate-fade-in">
      <PremiumEngagementRail variant="mobile" />

      <PremiumHomeHero
        variant="mobile"
        firstName={firstName}
        campusLabel={campus.city}
        nextServiceLabel={nextService}
      />

      {urgentAlerts.length > 0 ? (
        <UrgentNewsHomeStrip alerts={urgentAlerts} variant="mobile" highlightAlertId={highlightAlertId} />
      ) : null}

      <PremiumMobileLauncher />

      <PremiumUpcomingEvents rows={upcomingEventRows} variant="mobile" />

      <PremiumMobileLiveCinema liveFlyerImage={churchImages.live} />

      <PremiumSermonSection video={latestSermon} variant="mobile" />

      <PremiumStoriesSection />

      <PremiumStayConnected />

      <PremiumPrayerGive />

      <CheckInHomeBanner />

      <Link href="/guest" className="premium-guest-cta">
        <span>First time here?</span>
        <span className="premium-guest-cta__pill">Connect</span>
      </Link>
    </div>
  );
}

function siteServiceTime() {
  return site.serviceTimes[1]?.time.split(" – ")[0] ?? site.serviceTimes[0].time.split(" – ")[0];
}
