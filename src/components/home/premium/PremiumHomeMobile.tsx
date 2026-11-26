"use client";

import { PrayerHomeBanner } from "@/components/meetings/PrayerHomeBanner";
import { AboutShanahHomeLink } from "@/components/home/premium/AboutShanahHomeLink";

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
      <div className="premium-home-v3 premium-home-v4 premium-home-v3--spacing-v3 shanah-porcelain-home animate-fade-in">
        {urgentAlerts.length > 0 ? (
          <UrgentNewsHomeStrip
            alerts={urgentAlerts}
            variant="mobile"
            highlightAlertId={highlightAlertId}
          />
        ) : null}

        <PremiumHomeV4Hero firstName={firstName} campusLabel={campus.city} editorial heroV3 />

        <div className="mx-4 pt-3"><PrayerHomeBanner variant="mobile" /></div>
        <Link href="/fasting-prayer-2027" className="mx-4 block rounded-xl bg-[#19283B] p-4 text-white"><p className="text-[10px] font-bold uppercase tracking-[.2em] text-amber-200">14 Days · November 30 – December 13</p><p className="mt-1 text-lg font-semibold">Fasting & Praying into 2027</p><p className="mt-1 text-sm text-slate-200">Read all 14 days of scriptures and prophetic prayers →</p></Link>
        <PremiumStoriesSection
          sectionTitle="Stories"
          storiesPresentation="v6"
          homeV3
        />

        <PremiumHomeV3QuickTiles />
        <PremiumHomeV4GiveBar />
        <PremiumHomeV4UpcomingEvents rows={upcomingEventRows} />
        <PremiumHomeV4LatestSermon video={latestSermon} />



        <AboutShanahHomeLink compact />

        <div className="premium-home-v3__balance-lower mx-4 mb-8 space-y-4 border-t border-slate-200 pt-5 dark:border-slate-700">
          <CheckInHomeBanner />

          <Link href="/guest" className="premium-guest-cta !min-h-[64px] !rounded-2xl !border !border-[#d7c3a4] !bg-white !px-4 !py-3 !text-[#17365a] shadow-sm dark:!border-slate-600 dark:!bg-[#203552] dark:!text-white">
            <span className="font-semibold">First time here?</span>
            <span className="premium-guest-cta__pill !bg-[#123d72] !px-5 !py-2 !text-white">Connect</span>
          </Link>
        </div>
      </div>
    </>
  );
}
