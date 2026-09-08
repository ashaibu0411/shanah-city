"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useApp } from "@/components/app/AppProvider";
import { useAuth } from "@/components/auth/AuthProvider";
import { DevotionPromoCard } from "@/components/devotions/DevotionPromoCard";
import { ChurchFlyerImage } from "@/components/home/ChurchFlyerImage";
import { liveStream, site } from "@/lib/site";
import { getYouTubeThumbnail } from "@/lib/streams";
import { pickTodayDevotion } from "@/lib/devotion-utils";
import type { ChurchSocialImages } from "@/lib/facebook-church-media";
import { churchSocialImageForAction } from "@/lib/facebook-church-media";
import { MobilePremiumExploreGrid } from "@/components/app/MobilePremiumTile";
import { MobilePremiumFrame } from "@/components/app/MobilePremiumFrame";
import { HomeTagline } from "@/components/home/HomeTagline";
import { LiveStreamCountdownInline } from "@/components/live/useLiveStreamSchedule";
import { PrayerHomeBanner } from "@/components/meetings/PrayerHomeBanner";
import { PendingRsvpHomeBanner } from "@/components/home/PendingRsvpHomeBanner";
import { UrgentAlertBanner } from "@/components/home/UrgentAlertBanner";
import type { Devotion } from "@/lib/types";
import type { CommunityPost } from "@/lib/member-types";
import type { UrgentAlert } from "@/lib/urgent-alert-types";

const todayShortcuts = [
  {
    label: "Check in",
    href: "/check-in",
    detail: "FrontLiners & kids",
    className: "from-teal-100 to-teal-200/90 text-teal-950 ring-teal-300/70",
  },
  {
    label: "Messages",
    href: "/messages",
    detail: "Chat & updates",
    className: "from-sky-100 to-cyan-100 text-cyan-950 ring-cyan-300/60",
  },
  {
    label: "Meetings",
    href: "/meetings",
    detail: "Prayer & events",
    className: "from-violet-100 to-indigo-100 text-indigo-950 ring-violet-300/60",
  },
] as const;

function homeGreeting(name?: string | null) {
  const hour = new Date().getHours();
  const time =
    hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  if (!name?.trim()) return time;
  return `${time}, ${name.trim().split(" ")[0]}`;
}

type MobileHomeProps = {
  posts: CommunityPost[];
  todayDevotion: Devotion | null;
  urgentAlert: UrgentAlert | null;
  churchImages: ChurchSocialImages;
  highlightAlert?: boolean;
};

export function MobileHome({
  todayDevotion,
  urgentAlert,
  churchImages,
  highlightAlert = false,
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
  const anyLive =
    liveStream.isLive ||
    liveStream.youtube.isLive ||
    liveStream.facebook.isLive;
  const liveVideoId = liveStream.youtube.videoId?.trim();
  const liveThumbnail = liveVideoId ? getYouTubeThumbnail(liveVideoId) : null;
  const nextService =
    site.serviceTimes[1]?.time.split(" – ")[0] ?? site.serviceTimes[0].time.split(" – ")[0];

  return (
    <div className="mobile-home animate-fade-in space-y-4">
      <UrgentAlertBanner alert={urgentAlert} variant="mobile" highlighted={highlightAlert} />
      <PendingRsvpHomeBanner />
      <PrayerHomeBanner variant="mobile" />

      <MobilePremiumFrame
        variant="surface"
        className="mobile-home-welcome-stack overflow-hidden ring-1 ring-teal-200/45"
      >
        <div className="mobile-home-welcome-intro border-b border-teal-100/80 bg-gradient-to-r from-teal-50/95 via-white to-amber-50/80 px-4 py-3.5">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-teal-700/85">
            {homeGreeting(user?.name)}
          </p>
          <p className="mt-1 font-display text-[0.95rem] font-semibold uppercase tracking-[0.14em] text-night-900">
            Welcome to {site.name}
          </p>
        </div>

        <div className="mobile-home-welcome mobile-home-welcome-hero relative text-white">
          <div className="mobile-home-aurora-bg pointer-events-none absolute inset-0" aria-hidden />

          <div className="relative p-4">
            <div
              className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-amber-400 via-amber-300/80 to-teal-400"
              aria-hidden
            />

            <HomeTagline size="mobile" tone="dark" />

            <div className="mobile-home-welcome-chip mt-3 inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold tracking-wide text-sand-100">
              Sun {nextService} · {campus.city}
            </div>
          </div>
        </div>
      </MobilePremiumFrame>

      <section>
        <h2 className="mobile-section-title mb-2.5 px-0.5">Today</h2>
        <div className="grid grid-cols-3 gap-2">
          {todayShortcuts.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`mobile-today-tile block bg-gradient-to-br p-3 ring-1 transition active:scale-[0.98] ${item.className}`}
            >
              <p className="text-sm font-bold leading-tight">{item.label}</p>
              <p className="mt-1 text-[11px] leading-snug opacity-75">{item.detail}</p>
            </Link>
          ))}
        </div>
      </section>

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
                className="mobile-premium-4k__media mobile-media object-cover transition duration-700 group-hover:scale-[1.04]"
              />
            )}
          </div>

          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-night-950/90 via-night-950/35 to-teal-900/10" />

          <div className="relative flex h-full flex-col justify-between p-4">
            <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-sand-200/95">
              Shanah City Live
            </p>

            <div>
              {anyLive ? (
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
                {anyLive ? liveStream.title : "Watch Live"}
              </p>

              <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-teal-100/85 sm:text-xs sm:tracking-[0.2em]">
                {anyLive ? "Join the stream" : "Sundays & special services"}
              </p>

              <span className="mt-2.5 inline-flex items-center gap-2 rounded-full bg-white/95 px-3 py-1.5 text-[11px] font-bold text-teal-900 shadow-app-md backdrop-blur-sm sm:mt-3 sm:px-3.5 sm:py-2 sm:text-xs">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-teal-700 text-[10px] text-white">
                  ▶
                </span>
                {anyLive ? "Join stream" : "Open live"}
              </span>
            </div>
          </div>
        </Link>
      </MobilePremiumFrame>

      {devotion ? (
        <DevotionPromoCard devotion={devotion} variant="mobile" className="space-y-0" />
      ) : null}

      <section>
        <h2 className="mobile-section-title mb-2.5 px-0.5">Explore</h2>
        <MobilePremiumExploreGrid
          imageForAction={(action) => churchSocialImageForAction(churchImages, action)}
        />
      </section>

      <Link
        href="/guest"
        className="mobile-card mobile-premium-surface flex items-center justify-between border border-emerald-200/70 bg-gradient-to-r from-emerald-50/95 to-teal-50/90 px-3.5 py-2.5 text-sm font-semibold text-emerald-950 transition active:scale-[0.99]"
      >
        First time here?
        <span className="rounded-full bg-emerald-700 px-3 py-1 text-xs font-bold text-white shadow-sm shadow-emerald-900/20">
          Connect
        </span>
      </Link>
    </div>
  );
}
