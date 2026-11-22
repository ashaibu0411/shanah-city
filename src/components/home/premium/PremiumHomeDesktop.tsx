"use client";

import { PrayerHomeBanner } from "@/components/meetings/PrayerHomeBanner";
import Link from "next/link";
import { AboutShanahHomeLink } from "@/components/home/premium/AboutShanahHomeLink";

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
      <PrayerHomeBanner variant="desktop" />
      {urgentAlerts.length > 0 ? (
        <UrgentNewsHomeStrip
          alerts={urgentAlerts}
          highlightAlertId={highlightAlertId}
          variant="desktop"
        />
      ) : null}

      <Link href="/fasting-prayer-2027" className="mb-6 block rounded-2xl bg-[#122c54] px-6 py-5 text-white"><span className="text-xs font-semibold uppercase tracking-widest text-amber-200">November 30 – December 13</span><h2 className="mt-2 text-2xl font-semibold">14 Days of Fasting & Praying into 2027</h2><p className="mt-1 text-sm text-slate-200">Read the complete daily guide →</p></Link>
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

      <AboutShanahHomeLink />

      <PremiumCampusSection />

      <div className="premium-engagement-rail premium-engagement-rail--footer">
        <CheckInHomeBanner />
      </div>
    </div>
  );
}
