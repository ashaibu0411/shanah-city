"use client";

import { PremiumHomeV4Link as Link } from "@/components/home/premium/v4/PremiumHomeV4Link";
import { PrayerHomeBanner } from "@/components/meetings/PrayerHomeBanner";
import { AboutShanahHomeLink } from "@/components/home/premium/AboutShanahHomeLink";
import { useApp } from "@/components/app/AppProvider";
import { useAuth } from "@/components/auth/AuthProvider";
import { UrgentNewsHomeStrip } from "@/components/home/UrgentNewsHomeStrip";
import { PremiumStoriesSection } from "@/components/home/premium/PremiumStoriesSection";
import { CheckInHomeBanner } from "@/components/home/DailyEngagementBanners";
import { PremiumHomeV4Chrome } from "@/components/home/premium/v4/PremiumHomeV4Chrome";
import { PremiumHomeV4Hero } from "@/components/home/premium/v4/PremiumHomeV4Hero";
import { PremiumHomeV4QuickTiles } from "@/components/home/premium/v4/PremiumHomeV4QuickTiles";
import { PremiumHomeV4GiveBar } from "@/components/home/premium/v4/PremiumHomeV4GiveBar";
import { PremiumHomeV4UpcomingEvents } from "@/components/home/premium/v4/PremiumHomeV4UpcomingEvents";
import { PremiumHomeV4LatestSermon } from "@/components/home/premium/v4/PremiumHomeV4LatestSermon";
import { PremiumHomeV4DailyDevotion } from "@/components/home/premium/v4/PremiumHomeV4DailyDevotion";
import { PremiumHomeV4Greeting } from "@/components/home/premium/v4/PremiumHomeV4Greeting";
import { getPublicDisplayFirstName } from "@/lib/member-display-name";
import type { Devotion } from "@/lib/types";
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
  todayDevotion?: Devotion | null;
};

export function PremiumHomeMobile({
  urgentAlerts,
  highlightAlertId = null,
  churchImages: _churchImages,
  latestSermon,
  upcomingEventRows,
  todayDevotion = null,
}: PremiumHomeMobileProps) {
  const { campus } = useApp();
  const { user } = useAuth();
  const firstName = user ? getPublicDisplayFirstName(user) : null;

  return (
    <>
      <PremiumHomeV4Chrome />
      <div
        className={`premium-home-v4 shanah-porcelain-home animate-fade-in${user ? " premium-home-v4--signed-in" : " premium-home-v4--signed-out"}`}
      >
        <div className="mx-4 pt-3">
          <PrayerHomeBanner variant="mobile" />
        </div>

        <Link
          href="/fasting-prayer-2027"
          className="mx-4 block rounded-2xl border border-[#c9a66b]/35 bg-[#10264a] p-4 text-[#f8f7f4] shadow-[0_8px_24px_rgba(6,19,41,0.35)]"
        >
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#e8d4b0]">
            November 30 – December 13
          </p>
          <p className="mt-1 text-lg font-semibold font-display">Fasting &amp; praying into 2027</p>
          <p className="mt-1 text-sm text-white/78">Read the daily guide →</p>
        </Link>

        <PremiumHomeV4Greeting firstName={firstName} />
        <PremiumStoriesSection sectionTitle="Stories" storiesPresentation="v6" homeV3 />

        <PremiumHomeV4Hero
          firstName={firstName}
          campusLabel={campus.city}
          editorial
          heroV3
          showPersonalGreeting={false}
        />

        <PremiumHomeV4DailyDevotion devotion={todayDevotion} />
        <PremiumHomeV4QuickTiles />
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

        <AboutShanahHomeLink compact />

        <div className="premium-home-v4__balance-lower mx-4 mb-8 space-y-4 rounded-2xl border border-[#c9a66b]/25 bg-[#f8f7f4] p-4 dark:border-[#c9a66b]/20 dark:bg-[#14243c] sm:p-5">
          <CheckInHomeBanner />
          <Link
            href="/guest"
            className="premium-guest-cta !min-h-[64px] !rounded-2xl !border !border-sand-300 !bg-white !px-4 !py-3 !text-[#10264a] shadow-sm dark:!border-slate-600 dark:!bg-[#203552] dark:!text-white"
          >
            <span className="font-semibold">First time here?</span>
            <span className="premium-guest-cta__pill !bg-[#10264a] !px-5 !py-2 !text-[#f8f7f4]">
              Connect
            </span>
          </Link>
        </div>
      </div>
    </>
  );
}