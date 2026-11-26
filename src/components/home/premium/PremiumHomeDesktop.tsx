"use client";

import Link from "next/link";
import { PrayerHomeBanner } from "@/components/meetings/PrayerHomeBanner";
import { AboutShanahHomeLink } from "@/components/home/premium/AboutShanahHomeLink";
import { UrgentNewsHomeStrip } from "@/components/home/UrgentNewsHomeStrip";
import { PremiumEngagementRail } from "@/components/home/premium/PremiumEngagementRail";
import { PremiumStoriesSection } from "@/components/home/premium/PremiumStoriesSection";
import { PremiumLivePanel } from "@/components/home/premium/PremiumLivePanel";
import { CheckInHomeBanner } from "@/components/home/DailyEngagementBanners";
import { PremiumHomeHero } from "@/components/home/premium/PremiumHomeHero";
import { PremiumHomeV4QuickTiles } from "@/components/home/premium/v4/PremiumHomeV4QuickTiles";
import { PremiumHomeV4DailyDevotion } from "@/components/home/premium/v4/PremiumHomeV4DailyDevotion";
import { PremiumHomeV4UpcomingEvents } from "@/components/home/premium/v4/PremiumHomeV4UpcomingEvents";
import { PremiumHomeV4LatestSermon } from "@/components/home/premium/v4/PremiumHomeV4LatestSermon";
import { PremiumHomeV4GiveBar } from "@/components/home/premium/v4/PremiumHomeV4GiveBar";
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
    <div className="premium-home premium-home--desktop premium-home--desktop-v4">
      <PrayerHomeBanner variant="desktop" />
      {urgentAlerts.length > 0 ? (
        <UrgentNewsHomeStrip
          alerts={urgentAlerts}
          highlightAlertId={highlightAlertId}
          variant="desktop"
        />
      ) : null}

      <Link
        href="/fasting-prayer-2027"
        className="block rounded-2xl border border-gold-300/40 bg-[#10264a] px-6 py-5 text-[#f8f7f4] shadow-[0_12px_32px_rgba(16,38,74,0.15)]"
      >
        <span className="text-xs font-semibold uppercase tracking-[0.16em] text-[#e8d4b0]">
          November 30 – December 13
        </span>
        <h2 className="mt-2 font-display text-2xl font-semibold">
          Fasting &amp; praying into 2027
        </h2>
        <p className="mt-1 text-sm text-white/75">Read the complete daily guide →</p>
      </Link>

      <PremiumEngagementRail variant="desktop" />
      <PremiumStoriesSection />
      <PremiumHomeHero variant="desktop" firstName={firstName} />

      <div className="premium-home--desktop-v4__grid">
        <PremiumHomeV4QuickTiles />
        <PremiumHomeV4DailyDevotion />
      </div>

      <div className="premium-home__split premium-home--desktop-v4__split">
        <div className="premium-home__split-main">
          <PremiumHomeV4UpcomingEvents rows={upcomingEventRows} />
        </div>
        <div className="premium-home__split-aside">
          <PremiumLivePanel liveFlyerImage={churchImages.live} variant="desktop" />
        </div>
      </div>

      <div className="premium-home--desktop-v4__sermon-row">
        <PremiumHomeV4LatestSermon video={latestSermon} />
        <PremiumHomeV4GiveBar />
      </div>

      <AboutShanahHomeLink />

      <div className="premium-engagement-rail premium-engagement-rail--footer">
        <CheckInHomeBanner />
      </div>
    </div>
  );
}