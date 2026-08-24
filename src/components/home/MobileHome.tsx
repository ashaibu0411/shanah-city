"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useApp } from "@/components/app/AppProvider";
import { ChurchFlyerImage } from "@/components/home/ChurchFlyerImage";
import { liveStream, site } from "@/lib/site";
import { getYouTubeThumbnail } from "@/lib/streams";
import { pickTodayDevotion } from "@/lib/devotion-utils";
import { getDevotionArtwork } from "@/lib/devotion-artwork";
import { churchSocialImageForAction } from "@/lib/facebook-church-media";
import type { ChurchSocialImages } from "@/lib/facebook-church-media";
import { HomeTagline } from "@/components/home/HomeTagline";
import { LiveStreamCountdownInline } from "@/components/live/useLiveStreamSchedule";
import { MobileQuickActionFlyer } from "@/components/home/MobileQuickActionFlyer";
import { PendingRsvpHomeBanner } from "@/components/home/PendingRsvpHomeBanner";
import { UrgentAlertBanner } from "@/components/home/UrgentAlertBanner";
import type { Devotion } from "@/lib/types";
import type { CommunityPost } from "@/lib/member-types";
import type { UrgentAlert } from "@/lib/urgent-alert-types";

const mobileQuickActions = [
  { label: "Give", href: "/give", icon: "give" },
  { label: "Connect", href: "/connect", icon: "connect" },
  { label: "Community", href: "/community", icon: "community" },
  { label: "Devotions", href: "/devotions", icon: "devotions" },
] as const;

type MobileHomeProps = {
  posts: CommunityPost[];
  todayDevotion: Devotion | null;
  urgentAlert: UrgentAlert | null;
  churchImages: ChurchSocialImages;
  highlightAlert?: boolean;
};

export function MobileHome({
  posts,
  todayDevotion,
  urgentAlert,
  churchImages,
  highlightAlert = false,
}: MobileHomeProps) {
  const { campus } = useApp();
  const [devotion, setDevotion] = useState<Devotion | null>(todayDevotion);
  const devotionArtworkUrl = devotion ? getDevotionArtwork(devotion, "wide") : null;

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
    <div className="mobile-home animate-fade-in space-y-3">
      <UrgentAlertBanner alert={urgentAlert} variant="mobile" highlighted={highlightAlert} />
      <PendingRsvpHomeBanner />
      <section className="mobile-home-aurora relative overflow-hidden rounded-2xl p-4 text-white shadow-app-lg ring-1 ring-night-900/10">
        <div className="mobile-home-aurora-bg pointer-events-none absolute inset-0" aria-hidden />
        <div className="mobile-home-shimmer pointer-events-none absolute inset-0 opacity-30" aria-hidden />

        <div className="relative">
          <HomeTagline size="mobile" />

          <div className="mobile-home-fade-up mobile-home-fade-up-3 mt-2.5 inline-flex rounded-full border border-white/15 bg-black/15 px-2.5 py-0.5 text-[11px] font-semibold tracking-wide text-sand-100 backdrop-blur-md">
            Sun {nextService} · {campus.city}
          </div>
        </div>
      </section>

      <Link
        href="/live"
        className="mobile-home-live-flyer group relative block aspect-[16/10] overflow-hidden rounded-2xl shadow-app-lg ring-1 ring-night-900/10 transition active:scale-[0.99]"
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

        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-night-950/90 via-night-900/35 to-night-800/15" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_12%,rgba(255,255,255,0.14),transparent_42%)]" />

        <div className="relative flex h-full flex-col justify-between p-4">
          <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-sand-200/90">
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

            <p className="font-display text-2xl font-bold leading-tight tracking-tight text-white drop-shadow-md">
              {anyLive ? liveStream.title : "Watch Live"}
            </p>

            <p className="mt-1 text-xs font-semibold uppercase tracking-[0.2em] text-sand-200/80">
              {anyLive ? "Join the stream" : "Sundays & special services"}
            </p>

            <span className="mt-3 inline-flex items-center gap-2 rounded-full bg-white/95 px-3.5 py-2 text-xs font-bold text-night-900 shadow-app-md backdrop-blur-sm">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-night-900 text-[10px] text-white">
                ▶
              </span>
              {anyLive ? "Join stream" : "Open live"}
            </span>
          </div>
        </div>
      </Link>

      {devotion && (
        <div className="space-y-2">
          <p className="px-0.5 text-[11px] font-bold uppercase tracking-[0.22em] text-night-500">
            Today&apos;s Word
          </p>
          <Link
            href={`/devotions?id=${encodeURIComponent(devotion.id)}`}
            className="mobile-card block overflow-hidden transition active:scale-[0.99]"
          >
            {devotionArtworkUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={devotionArtworkUrl}
                alt=""
                className="aspect-[16/9] w-full object-cover"
              />
            ) : null}
            <div className="flex items-center justify-between gap-3 p-3.5">
              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-wider text-sand-600">
                  {devotion.readingTime}
                </p>
                <p className="mt-0.5 truncate font-sans text-base font-bold tracking-tight text-night-900">
                  {devotion.title}
                </p>
              </div>
              <span className="shrink-0 rounded-full bg-night-900 px-2.5 py-1 text-[11px] font-bold text-white">
                Read
              </span>
            </div>
          </Link>
        </div>
      )}

      <div className="grid grid-cols-2 gap-2.5">
        {mobileQuickActions.map((action) => (
          <Link
            key={action.label}
            href={action.href}
            aria-label={action.label}
            className="mobile-action-flyer group block overflow-hidden rounded-2xl shadow-app-lg ring-1 ring-night-900/10 transition active:scale-[0.98]"
          >
            <MobileQuickActionFlyer
              name={action.icon}
              imageSrc={churchSocialImageForAction(churchImages, action.icon)}
              className="h-full w-full"
            />
          </Link>
        ))}
      </div>

      {featuredPost && (
        <Link
          href="/community"
          className="mobile-card block p-3.5 transition active:scale-[0.99]"
        >
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-bold tracking-tight text-night-900">Community</p>
            <span className="text-xs font-semibold text-night-500">See all →</span>
          </div>
          <p className="mt-1.5 line-clamp-2 text-sm leading-snug text-night-600">
            {featuredPost.content}
          </p>
        </Link>
      )}

      <Link
        href="/guest"
        className="mobile-card flex items-center justify-between border border-emerald-200/80 bg-gradient-to-r from-emerald-50/90 to-teal-50/90 px-3.5 py-2.5 text-sm font-semibold text-emerald-900 transition active:scale-[0.99]"
      >
        First time here?
        <span className="rounded-full bg-emerald-600 px-3 py-1 text-xs font-bold text-white">
          Connect
        </span>
      </Link>
    </div>
  );
}
