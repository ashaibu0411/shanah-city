"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { StreamPreviewImage } from "@/components/live/StreamPreviewImage";
import { useApp } from "@/components/app/AppProvider";
import { liveStream, site } from "@/lib/site";
import { getYouTubeThumbnail, streamPreviews } from "@/lib/streams";
import { pickTodayDevotion } from "@/lib/devotion-utils";
import { HomeTagline } from "@/components/home/HomeTagline";
import { UrgentAlertBanner } from "@/components/home/UrgentAlertBanner";
import type { Devotion } from "@/lib/types";
import type { CommunityPost } from "@/lib/member-types";
import type { UrgentAlert } from "@/lib/urgent-alert-types";

const mobileQuickActions = [
  {
    label: "Give",
    href: "/give",
    icon: "♢",
    tone: "from-violet-600 via-purple-600 to-fuchsia-700",
    glow: "shadow-violet-500/30",
  },
  {
    label: "Connect",
    href: "/connect",
    icon: "▣",
    tone: "from-sky-500 via-blue-600 to-indigo-700",
    glow: "shadow-blue-500/30",
  },
  {
    label: "Community",
    href: "/community",
    icon: "♡",
    tone: "from-emerald-500 via-teal-500 to-cyan-600",
    glow: "shadow-emerald-500/30",
  },
  {
    label: "Devotions",
    href: "/devotions",
    icon: "✦",
    tone: "from-amber-500 via-orange-500 to-rose-600",
    glow: "shadow-amber-500/30",
  },
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
    <div className="mobile-home space-y-4">
      <UrgentAlertBanner alert={urgentAlert} variant="mobile" />
      <section className="mobile-home-aurora relative overflow-hidden rounded-[1.75rem] p-5 text-white shadow-2xl shadow-indigo-950/40 ring-1 ring-white/10">
        <div className="mobile-home-aurora-bg pointer-events-none absolute inset-0" aria-hidden />
        <div className="mobile-home-shimmer pointer-events-none absolute inset-0 opacity-40" aria-hidden />

        <div className="relative">
          <HomeTagline size="mobile" />

          <div className="mobile-home-fade-up mobile-home-fade-up-3 mt-3 inline-flex rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold text-amber-100 backdrop-blur-md">
            Sun {nextService} · {campus.city}
          </div>
        </div>
      </section>

      <Link
        href="/live"
        className="mobile-home-spotlight group relative block overflow-hidden rounded-[1.75rem] shadow-2xl ring-1 ring-white/20"
      >
        <div className="absolute inset-0">
          {anyLive && liveThumbnail ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={liveThumbnail}
              alt=""
              className="h-full w-full scale-105 object-cover transition duration-700 group-hover:scale-110"
            />
          ) : (
            <div className="grid h-full grid-cols-3">
              {spotlightPreviews.map((preview) => (
                <div key={preview.id} className="relative h-full min-h-[11rem] overflow-hidden">
                  <StreamPreviewImage
                    preview={preview}
                    alt=""
                    className="h-full w-full scale-110 object-cover transition duration-700 group-hover:scale-[1.15]"
                  />
                  <div className="absolute inset-0 bg-night-950/25" />
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="absolute inset-0 bg-gradient-to-t from-violet-950 via-fuchsia-900/88 to-rose-600/55" />
        <div className="mobile-home-spotlight-mesh pointer-events-none absolute inset-0 opacity-80" aria-hidden />

        <div className="relative flex min-h-[11rem] flex-col justify-end p-5">
          {anyLive ? (
            <span className="mb-3 inline-flex w-fit items-center gap-1.5 rounded-full bg-white px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-red-600">
              <span className="mobile-home-pulse h-2 w-2 rounded-full bg-red-600" />
              Live
            </span>
          ) : null}

          <p className="font-sans text-xl font-bold leading-tight text-white">
            {anyLive ? liveStream.title : "Watch live"}
          </p>

          <span className="mt-3 inline-flex w-fit items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-bold text-night-900 shadow-lg">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-red-500 to-rose-600 text-xs text-white">
              ▶
            </span>
            {anyLive ? "Join stream" : "Open live"}
          </span>
        </div>
      </Link>

      {devotion && (
        <Link
          href="/devotions"
          className="mobile-card flex items-center justify-between gap-3 overflow-hidden rounded-2xl p-4 transition active:scale-[0.99]"
        >
          <div className="min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-wide text-amber-700/80">
              Today · {devotion.readingTime}
            </p>
            <p className="mt-1 truncate font-sans text-lg font-bold text-night-900">
              {devotion.title}
            </p>
          </div>
          <span className="shrink-0 rounded-full bg-night-900 px-3 py-1.5 text-xs font-bold text-white">
            Read
          </span>
        </Link>
      )}

      <div className="grid grid-cols-2 gap-3">
        {mobileQuickActions.map((action) => (
          <Link
            key={action.label}
            href={action.href}
            className={`group relative overflow-hidden rounded-2xl bg-gradient-to-br ${action.tone} p-4 text-white shadow-lg ${action.glow} transition active:scale-[0.98]`}
          >
            <div className="pointer-events-none absolute -right-4 -top-4 h-20 w-20 rounded-full bg-white/20 blur-2xl" />
            <span className="relative text-2xl">{action.icon}</span>
            <p className="relative mt-2 text-base font-bold">{action.label}</p>
          </Link>
        ))}
      </div>

      {featuredPost && (
        <Link
          href="/community"
          className="mobile-card block rounded-2xl p-4 transition active:scale-[0.99]"
        >
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-bold text-night-900">Community</p>
            <span className="text-xs font-semibold text-violet-700">See all →</span>
          </div>
          <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-night-700">
            {featuredPost.content}
          </p>
        </Link>
      )}

      <Link
        href="/guest"
        className="mobile-card flex items-center justify-between rounded-2xl border border-emerald-300/60 bg-gradient-to-r from-emerald-50 to-teal-50 px-4 py-3 text-sm font-semibold text-emerald-900 transition active:scale-[0.99]"
      >
        First time here?
        <span className="rounded-full bg-emerald-600 px-3 py-1 text-xs font-bold text-white">
          Connect
        </span>
      </Link>
    </div>
  );
}
