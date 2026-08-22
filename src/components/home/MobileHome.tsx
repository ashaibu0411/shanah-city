"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { StreamPreviewImage } from "@/components/live/StreamPreviewImage";
import { useApp } from "@/components/app/AppProvider";
import { liveStream, site } from "@/lib/site";
import { getYouTubeThumbnail, streamPreviews } from "@/lib/streams";
import { pickTodayDevotion } from "@/lib/devotion-utils";
import { HomeTagline } from "@/components/home/HomeTagline";
import { MobileQuickActionFlyer } from "@/components/home/MobileQuickActionFlyer";
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
};

export function MobileHome({ posts, todayDevotion, urgentAlert }: MobileHomeProps) {
  const { campus } = useApp();
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
  const spotlightPreviews = streamPreviews.filter((preview) =>
    ["youtube", "facebook-city", "instagram-city"].includes(preview.id),
  );
  const liveVideoId = liveStream.youtube.videoId?.trim();
  const liveThumbnail = liveVideoId ? getYouTubeThumbnail(liveVideoId) : null;
  const nextService =
    site.serviceTimes[1]?.time.split(" – ")[0] ?? site.serviceTimes[0].time.split(" – ")[0];

  return (
    <div className="mobile-home animate-fade-in space-y-3">
      <UrgentAlertBanner alert={urgentAlert} variant="mobile" />
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
        className="mobile-home-spotlight group relative block overflow-hidden rounded-2xl shadow-app-lg ring-1 ring-night-900/10"
      >
        <div className="absolute inset-0">
          {anyLive && liveThumbnail ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={liveThumbnail}
              alt=""
              decoding="async"
              className="mobile-media h-full w-full scale-[1.02] object-cover transition duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="grid h-full grid-cols-3">
              {spotlightPreviews.map((preview) => (
                <div key={preview.id} className="relative h-full min-h-[9.5rem] overflow-hidden">
                  <StreamPreviewImage
                    preview={preview}
                    alt=""
                    className="mobile-media h-full w-full scale-105 object-cover transition duration-500 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-night-950/20" />
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="absolute inset-0 bg-gradient-to-t from-night-950/95 via-night-900/55 to-night-800/20" />
        <div className="mobile-home-spotlight-mesh pointer-events-none absolute inset-0 opacity-50" aria-hidden />

        <div className="relative flex min-h-[9.5rem] flex-col justify-end p-4">
          {anyLive ? (
            <span className="mb-2 inline-flex w-fit items-center gap-1.5 rounded-full bg-white px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-red-600">
              <span className="mobile-home-pulse h-1.5 w-1.5 rounded-full bg-red-600" />
              Live
            </span>
          ) : null}

          <p className="font-sans text-lg font-bold leading-tight tracking-tight text-white">
            {anyLive ? liveStream.title : "Watch live"}
          </p>

          <span className="mt-2.5 inline-flex w-fit items-center gap-2 rounded-full bg-white px-3 py-1.5 text-xs font-bold text-night-900 shadow-app-sm">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-night-900 text-[10px] text-white">
              ▶
            </span>
            {anyLive ? "Join stream" : "Open live"}
          </span>
        </div>
      </Link>

      {devotion && (
        <Link
          href="/devotions"
          className="mobile-card flex items-center justify-between gap-3 overflow-hidden p-3.5 transition active:scale-[0.99]"
        >
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-wider text-sand-600">
              Today · {devotion.readingTime}
            </p>
            <p className="mt-0.5 truncate font-sans text-base font-bold tracking-tight text-night-900">
              {devotion.title}
            </p>
          </div>
          <span className="shrink-0 rounded-full bg-night-900 px-2.5 py-1 text-[11px] font-bold text-white">
            Read
          </span>
        </Link>
      )}

      <div className="grid grid-cols-2 gap-2.5">
        {mobileQuickActions.map((action) => (
          <Link
            key={action.label}
            href={action.href}
            aria-label={action.label}
            className="mobile-action-flyer group block overflow-hidden rounded-2xl shadow-app-lg ring-1 ring-night-900/10 transition active:scale-[0.98]"
          >
            <MobileQuickActionFlyer name={action.icon} className="h-full w-full" />
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
