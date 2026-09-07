"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { useApp } from "@/components/app/AppProvider";
import { DevotionPromoCard } from "@/components/devotions/DevotionPromoCard";
import { ChurchFlyerImage } from "@/components/home/ChurchFlyerImage";
import { liveStream, site } from "@/lib/site";
import { getYouTubeThumbnail } from "@/lib/streams";
import { pickTodayDevotion } from "@/lib/devotion-utils";
import { churchSocialImageForAction } from "@/lib/facebook-church-media";
import type { ChurchSocialImages } from "@/lib/facebook-church-media";
import { HomeTagline } from "@/components/home/HomeTagline";
import { LiveStreamCountdownInline } from "@/components/live/useLiveStreamSchedule";
import { MobileQuickActionFlyer } from "@/components/home/MobileQuickActionFlyer";
import { PrayerHomeBanner } from "@/components/meetings/PrayerHomeBanner";
import { PendingRsvpHomeBanner } from "@/components/home/PendingRsvpHomeBanner";
import { UrgentAlertBanner } from "@/components/home/UrgentAlertBanner";
import type { Devotion } from "@/lib/types";
import type { CommunityPost } from "@/lib/member-types";
import type { UrgentAlert } from "@/lib/urgent-alert-types";

const mobileQuickActions = [
  { label: "Give", href: "/give", icon: "give" as const, tone: "from-teal-600/85 via-teal-900/35 to-teal-950/90" },
  { label: "Connect", href: "/connect", icon: "connect" as const, tone: "from-amber-500/75 via-night-900/30 to-night-950/90" },
  { label: "Community", href: "/community", icon: "community" as const, tone: "from-cyan-600/75 via-night-900/25 to-night-950/90" },
  { label: "Devotions", href: "/devotions", icon: "devotions" as const, tone: "from-teal-700/80 via-night-900/30 to-night-950/90" },
] as const;

const todayShortcuts = [
  {
    label: "Check in",
    href: "/check-in",
    detail: "FrontLiners & kids",
    className: "from-teal-50 to-teal-100/90 text-teal-950 ring-teal-200/80",
  },
  {
    label: "Give",
    href: "/give",
    detail: "Support the church",
    className: "from-sand-50 to-amber-50 text-night-900 ring-amber-200/70",
  },
  {
    label: "Watch live",
    href: "/live",
    detail: "Sundays & events",
    className: "from-cyan-50 to-teal-50 text-teal-950 ring-cyan-200/70",
  },
] as const;

type MobileHomeProps = {
  posts: CommunityPost[];
  todayDevotion: Devotion | null;
  urgentAlert: UrgentAlert | null;
  churchImages: ChurchSocialImages;
  highlightAlert?: boolean;
};

function homeGreeting(name?: string) {
  const hour = new Date().getHours();
  const time =
    hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  if (!name) return time;
  return `${time}, ${name.split(" ")[0]}`;
}

export function MobileHome({
  posts,
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
  const featuredPost = posts[0];
  const liveVideoId = liveStream.youtube.videoId?.trim();
  const liveThumbnail = liveVideoId ? getYouTubeThumbnail(liveVideoId) : null;
  const nextService =
    site.serviceTimes[1]?.time.split(" – ")[0] ?? site.serviceTimes[0].time.split(" – ")[0];

  return (
    <div className="mobile-home animate-fade-in space-y-4">
      <UrgentAlertBanner alert={urgentAlert} variant="mobile" highlighted={highlightAlert} />
      <PendingRsvpHomeBanner />
      <PrayerHomeBanner variant="mobile" />

      <div className="mobile-card overflow-hidden p-0">
        <div className="border-b border-teal-100 bg-gradient-to-r from-teal-50 via-white to-cyan-50 px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-teal-700/80">
            {homeGreeting(user?.name)}
          </p>
          <p className="mt-1 font-display text-lg font-semibold text-night-900">
            Welcome to {site.heroChurchName}
          </p>
        </div>

        <section className="relative overflow-hidden p-4 text-white">
          <div className="mobile-home-aurora-bg pointer-events-none absolute inset-0" aria-hidden />
          <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-teal-300 via-cyan-300 to-teal-400" aria-hidden />

          <div className="relative">
            <HomeTagline size="mobile" />

            <div className="mt-2.5 inline-flex rounded-full border border-white/15 bg-black/25 px-2.5 py-0.5 text-[11px] font-semibold tracking-wide text-sand-100">
              Sun {nextService} · {campus.city}
            </div>
          </div>
        </section>
      </div>

      <section>
        <h2 className="mobile-section-title mb-2.5 px-0.5">Today</h2>
        <div className="grid grid-cols-3 gap-2">
          {todayShortcuts.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`mobile-card block bg-gradient-to-br p-3 ring-1 transition active:scale-[0.98] ${item.className}`}
            >
              <p className="text-sm font-bold leading-tight">{item.label}</p>
              <p className="mt-1 text-[11px] leading-snug opacity-75">{item.detail}</p>
            </Link>
          ))}
        </div>
      </section>

      <Link
        href="/live"
        className="mobile-home-live-flyer group relative block min-h-[15.5rem] overflow-hidden rounded-[1.25rem] shadow-app-lg ring-1 ring-teal-900/10 transition active:scale-[0.99] sm:aspect-[16/10] sm:min-h-0"
      >
        <div className="absolute inset-[3px] rounded-[0.85rem] ring-1 ring-white/20" aria-hidden />
        <div className="absolute inset-0">
          {anyLive && liveThumbnail ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={liveThumbnail}
              alt=""
              decoding="async"
              className="mobile-media h-full w-full object-cover transition duration-700 group-hover:scale-[1.04]"
            />
          ) : (
            <ChurchFlyerImage
              src={churchImages.live}
              alt="Watch live"
              priority
              sizes="(max-width: 512px) 100vw, 480px"
              className="mobile-media object-cover transition duration-700 group-hover:scale-[1.04]"
            />
          )}
        </div>

        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-teal-950/90 via-night-950/35 to-teal-900/10" />

        <div className="relative flex h-full flex-col justify-between p-4">
          <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-cyan-100/95">
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

      {devotion ? <DevotionPromoCard devotion={devotion} className="space-y-2" /> : null}

      <section>
        <h2 className="mobile-section-title mb-2.5 px-0.5">Explore</h2>
        <div className="grid grid-cols-2 gap-2.5">
          {mobileQuickActions.map((action) => (
            <Link
              key={action.label}
              href={action.href}
              aria-label={action.label}
              className="mobile-action-flyer group block overflow-hidden rounded-[1.25rem] shadow-app-lg ring-1 ring-teal-900/10 transition active:scale-[0.98]"
            >
              <MobileQuickActionFlyer
                name={action.icon}
                imageSrc={churchSocialImageForAction(churchImages, action.icon)}
                overlayClassName={`bg-gradient-to-t ${action.tone}`}
                className="h-full w-full"
              />
            </Link>
          ))}
        </div>
      </section>

      {featuredPost && (
        <Link
          href="/community"
          className="mobile-card block p-3.5 transition active:scale-[0.99]"
        >
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-bold tracking-tight text-night-900">Community</p>
            <span className="text-xs font-semibold text-teal-700">See all →</span>
          </div>
          <p className="mt-1.5 line-clamp-2 text-sm leading-snug text-night-600">
            {featuredPost.content}
          </p>
        </Link>
      )}

      <Link
        href="/guest"
        className="mobile-card flex items-center justify-between border border-teal-200/80 bg-gradient-to-r from-teal-50/95 to-cyan-50/90 px-3.5 py-2.5 text-sm font-semibold text-teal-950 transition active:scale-[0.99]"
      >
        First time here?
        <span className="rounded-full bg-teal-700 px-3 py-1 text-xs font-bold text-white">
          Connect
        </span>
      </Link>
    </div>
  );
}
