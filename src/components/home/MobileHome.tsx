"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useOnAppRefresh } from "@/hooks/useOnAppRefresh";
import { useApp } from "@/components/app/AppProvider";
import { useAuth } from "@/components/auth/AuthProvider";
import { DevotionPromoCard } from "@/components/devotions/DevotionPromoCard";
import { ChurchFlyerImage } from "@/components/home/ChurchFlyerImage";
import { HomeLatestSermonMobile } from "@/components/home/HomeLatestSermonMobile";
import { HomeMobileHero } from "@/components/home/HomeMobileHero";
import { HomeQuickLauncher } from "@/components/home/HomeQuickLauncher";
import { HomeStoriesSection } from "@/components/home/HomeStoriesSection";
import { HomeUpcomingEventsMobile } from "@/components/home/HomeUpcomingEventsMobile";
import { liveStream, site } from "@/lib/site";
import { getPublicDisplayFirstName } from "@/lib/member-display-name";
import { getYouTubeThumbnail } from "@/lib/streams";
import { pickTodayDevotion } from "@/lib/devotion-utils";
import type { ChurchSocialImages } from "@/lib/facebook-church-media";
import { churchSocialImageForAction } from "@/lib/facebook-church-media";
import { homeLiveSpotlightMediaClass } from "@/lib/home-explore-tile-images";
import { MobilePremiumExploreGrid } from "@/components/app/MobilePremiumTile";
import { MobilePremiumFrame } from "@/components/app/MobilePremiumFrame";
import { LiveStreamCountdownInline, useUpcomingLiveStreamSchedule } from "@/components/live/useLiveStreamSchedule";
import { PrayerHomeBanner } from "@/components/meetings/PrayerHomeBanner";
import { PendingRsvpHomeBanner } from "@/components/home/PendingRsvpHomeBanner";
import {
  AnniversaryHomeBanner,
  DevotionBrowseNudge,
  LeaderReportHomeBanner,
  FollowUpHomeBanner,
  TrainingHomeBanner,
} from "@/components/home/DailyEngagementBanners";
import { UrgentNewsHomeStrip } from "@/components/home/UrgentNewsHomeStrip";
import type { Devotion } from "@/lib/types";
import type { HomeUpcomingEventRow } from "@/lib/home-upcoming-events";
import type { UrgentAlert } from "@/lib/urgent-alert-types";
import type { SermonVideo } from "@/lib/youtube-sermons-server";

function homeGreeting(name?: string | null) {
  const hour = new Date().getHours();
  const time =
    hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  if (!name?.trim()) return time;
  return `${time}, ${name.trim().split(" ")[0]}`;
}

type MobileHomeProps = {
  todayDevotion: Devotion | null;
  urgentAlerts: UrgentAlert[];
  churchImages: ChurchSocialImages;
  highlightAlertId?: string | null;
  latestSermon: SermonVideo | null;
  upcomingEventRows: HomeUpcomingEventRow[];
};

export function MobileHome({
  todayDevotion,
  urgentAlerts,
  churchImages,
  highlightAlertId = null,
  latestSermon,
  upcomingEventRows,
}: MobileHomeProps) {
  const { campus } = useApp();
  const { user } = useAuth();
  const [devotion, setDevotion] = useState<Devotion | null>(todayDevotion);

  useEffect(() => {
    setDevotion(todayDevotion);
  }, [todayDevotion]);

  useEffect(() => {
    fetch("/api/devotions", { cache: "no-store" })
      .then((response) => response.json())
      .then((data) => {
        if (Array.isArray(data.devotions)) {
          setDevotion(pickTodayDevotion(data.devotions));
        }
      })
      .catch(() => undefined);
  }, []);

  useOnAppRefresh(() => {
    fetch("/api/devotions", { cache: "no-store" })
      .then((response) => response.json())
      .then((data) => {
        if (Array.isArray(data.devotions)) {
          setDevotion(pickTodayDevotion(data.devotions));
        }
      })
      .catch(() => undefined);
  });

  const { livePhase, schedule: liveSchedule, refresh: refreshLiveSchedule } =
    useUpcomingLiveStreamSchedule();

  useOnAppRefresh(() => {
    void refreshLiveSchedule();
  });
  const anyLive =
    liveStream.isLive ||
    liveStream.youtube.isLive ||
    liveStream.facebook.isLive;
  const scheduledLive = livePhase === "live";
  const showAsLive = anyLive || scheduledLive;
  const liveVideoId = liveStream.youtube.videoId?.trim();
  const liveThumbnail = liveVideoId ? getYouTubeThumbnail(liveVideoId) : null;
  const nextService =
    site.serviceTimes[1]?.time.split(" – ")[0] ?? site.serviceTimes[0].time.split(" – ")[0];

  const heroImage =
    churchSocialImageForAction(churchImages, "connect") ||
    churchSocialImageForAction(churchImages, "community") ||
    churchImages.live;

  return (
    <div className="mobile-home mobile-home--refreshed animate-fade-in space-y-4 pb-2">
      <PendingRsvpHomeBanner />
      <AnniversaryHomeBanner />
      <PrayerHomeBanner variant="mobile" />

      <HomeMobileHero
        greeting={homeGreeting(user ? getPublicDisplayFirstName(user) : null)}
        heroImageSrc={heroImage}
        campusLabel={campus.city}
        nextServiceLabel={nextService}
      />

      {urgentAlerts.length > 0 ? (
        <UrgentNewsHomeStrip
          alerts={urgentAlerts}
          variant="mobile"
          highlightAlertId={highlightAlertId}
        />
      ) : null}

      <HomeQuickLauncher />

      <MobilePremiumFrame
        variant="surface"
        className="ring-1 ring-night-900/8 dark:ring-white/10"
      >
        <div className="border-b border-night-900/8 px-3 py-2 dark:border-white/10">
          <HomeStoriesSection />
        </div>
      </MobilePremiumFrame>

      <HomeLatestSermonMobile video={latestSermon} />
      <HomeUpcomingEventsMobile rows={upcomingEventRows} />

      <MobilePremiumFrame variant="cinema" className="mobile-home-live-flyer group block min-h-[15.5rem] transition active:scale-[0.99] sm:aspect-[16/10] sm:min-h-0">
        <Link href="/live" className="relative block h-full min-h-[15.5rem] sm:min-h-0">
          <div className="absolute inset-0">
            {anyLive && liveThumbnail ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={liveThumbnail}
                alt=""
                decoding="async"
                className="mobile-premium-4k__media mobile-media h-full w-full object-cover transition duration-700 group-hover:scale-[1.04]"
              />
            ) : (
              <ChurchFlyerImage
                src={churchImages.live}
                alt="Watch live"
                priority
                sizes="(max-width: 512px) 100vw, 480px"
                className={`mobile-premium-4k__media mobile-media transition duration-700 group-hover:scale-[1.04] ${homeLiveSpotlightMediaClass}`}
              />
            )}
          </div>

          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-night-950/90 via-night-950/35 to-teal-900/10" />

          <div className="relative flex h-full flex-col justify-between p-4">
            <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-sand-200/95">
              Shanah City Live
            </p>

            <div>
              {showAsLive ? (
                <span className="mb-2 inline-flex w-fit items-center gap-1.5 rounded-full bg-red-600 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white shadow-lg shadow-red-900/40">
                  <span className="mobile-home-pulse h-1.5 w-1.5 rounded-full bg-white" />
                  Live now
                </span>
              ) : (
                <div className="mb-2">
                  <LiveStreamCountdownInline />
                </div>
              )}

              <p className="font-display text-xl font-bold leading-tight tracking-tight text-white drop-shadow-md sm:text-2xl">
                {showAsLive
                  ? scheduledLive && liveSchedule
                    ? liveSchedule.title
                    : liveStream.title
                  : "Watch Live"}
              </p>

              <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-teal-100/85 sm:text-xs sm:tracking-[0.2em]">
                {showAsLive ? "Join the stream" : "Sundays & special services"}
              </p>

              <span className="mt-2.5 inline-flex items-center gap-2 rounded-full bg-white/95 px-3 py-1.5 text-[11px] font-bold text-teal-900 shadow-app-md backdrop-blur-sm sm:mt-3 sm:px-3.5 sm:py-2 sm:text-xs">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-night-950 text-[10px] text-white">
                  ▶
                </span>
                {showAsLive ? "Join stream" : "Open live"}
              </span>
            </div>
          </div>
        </Link>
      </MobilePremiumFrame>

      {devotion ? (
        <DevotionPromoCard devotion={devotion} variant="mobile" className="space-y-0" />
      ) : null}

      <DevotionBrowseNudge />

      <LeaderReportHomeBanner />
      <TrainingHomeBanner />
      <FollowUpHomeBanner />

      <section>
        <h2 className="mobile-section-title mb-2.5 px-0.5">Explore</h2>
        <MobilePremiumExploreGrid
          imageForAction={(action) => churchSocialImageForAction(churchImages, action)}
        />
      </section>

      <Link
        href="/guest"
        className="mobile-card mobile-premium-surface flex items-center justify-between border border-night-900/8 bg-white px-3.5 py-2.5 text-sm font-semibold text-night-900 transition active:scale-[0.99] dark:border-white/10 dark:bg-[var(--color-surface)] dark:text-sand-100"
      >
        First time here?
        <span className="rounded-full bg-emerald-700 px-3 py-1 text-xs font-bold text-white shadow-sm shadow-emerald-900/20">
          Connect
        </span>
      </Link>
    </div>
  );
}
