"use client";

import Link from "next/link";
import { useState } from "react";
import { BrandLogo } from "@/components/app/BrandLogo";
import { useApp } from "@/components/app/AppProvider";
import { liveStream, site } from "@/lib/site";
import type { Devotion } from "@/lib/types";
import type { CommunityPost } from "@/lib/member-types";

const mobileQuickActions = [
  {
    label: "Give",
    sub: "Support the mission",
    href: "/give",
    icon: "♢",
    tone: "from-violet-600 via-purple-600 to-fuchsia-700",
    glow: "shadow-violet-500/30",
  },
  {
    label: "Connect",
    sub: "Plan your visit",
    href: "/connect",
    icon: "▣",
    tone: "from-sky-500 via-blue-600 to-indigo-700",
    glow: "shadow-blue-500/30",
  },
  {
    label: "Community",
    sub: "Prayer & praise",
    href: "/community",
    icon: "♡",
    tone: "from-emerald-500 via-teal-500 to-cyan-600",
    glow: "shadow-emerald-500/30",
  },
  {
    label: "Devotions",
    sub: "Daily word",
    href: "/devotions",
    icon: "✦",
    tone: "from-amber-500 via-orange-500 to-rose-600",
    glow: "shadow-amber-500/30",
  },
] as const;

type MobileHomeProps = {
  posts: CommunityPost[];
  todayDevotion: Devotion | null;
};

export function MobileHome({ posts, todayDevotion }: MobileHomeProps) {
  const { campus } = useApp();
  const [completed, setCompleted] = useState(false);
  const devotion = todayDevotion;
  const anyLive =
    liveStream.isLive ||
    liveStream.youtube.isLive ||
    liveStream.facebook.isLive;
  const featuredPost = posts[0];

  return (
    <div className="mobile-home space-y-5 pb-8">
      <section className="mobile-home-aurora relative overflow-hidden rounded-[1.75rem] p-5 text-white shadow-2xl shadow-indigo-950/40 ring-1 ring-white/10">
        <div className="mobile-home-aurora-bg pointer-events-none absolute inset-0" aria-hidden />
        <div className="mobile-home-shimmer pointer-events-none absolute inset-0 opacity-40" aria-hidden />

        <div className="relative">
          <div className="flex items-center gap-3">
            <BrandLogo size="sm" priority className="border-white/80 shadow-lg shadow-black/20" />
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-amber-200/95">
                {campus.name}
              </p>
              <p className="text-xs text-white/60">{site.name}</p>
            </div>
          </div>

          <h1 className="mobile-home-headline mt-5 font-display text-[1.65rem] font-bold leading-[1.15] tracking-tight text-white drop-shadow-sm">
            {site.tagline}
          </h1>

          <p className="mt-3 text-sm leading-relaxed text-white/75">{site.welcome}</p>

          <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-semibold text-amber-100 backdrop-blur-md">
            <span className="mobile-home-pulse h-2 w-2 rounded-full bg-amber-300" />
            {site.serviceTimes[1]?.day ?? site.serviceTimes[0].day} ·{" "}
            {site.serviceTimes[1]?.time.split(" – ")[0] ?? site.serviceTimes[0].time.split(" – ")[0]}
          </div>
        </div>
      </section>

      <Link
        href="/live"
        className="mobile-home-spotlight group relative block overflow-hidden rounded-[1.75rem] shadow-2xl ring-1 ring-white/20"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-rose-600 via-fuchsia-600 to-violet-800" />
        <div className="mobile-home-spotlight-mesh pointer-events-none absolute inset-0 opacity-90" aria-hidden />
        <div className="pointer-events-none absolute -left-8 top-1/2 h-40 w-40 -translate-y-1/2 rounded-full bg-yellow-300/40 blur-3xl" />
        <div className="pointer-events-none absolute -right-6 bottom-0 h-48 w-48 rounded-full bg-cyan-400/35 blur-3xl" />

        <div className="relative flex min-h-[11.5rem] flex-col justify-between p-5">
          <div className="flex flex-wrap items-center gap-2">
            {anyLive ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-red-600 shadow-lg">
                <span className="mobile-home-pulse h-2 w-2 rounded-full bg-red-600" />
                Live now
              </span>
            ) : (
              <span className="rounded-full border border-white/25 bg-white/15 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-white backdrop-blur-sm">
                Media & live
              </span>
            )}
            <span className="rounded-full bg-black/25 px-2.5 py-1 text-[10px] font-bold text-white backdrop-blur-sm">
              YouTube · Instagram
            </span>
          </div>

          <div>
            <p className="font-display text-2xl font-bold leading-tight text-white drop-shadow-md">
              {anyLive ? liveStream.title : "Watch & worship with us"}
            </p>
            <p className="mt-1.5 text-sm text-white/85">
              {anyLive
                ? `${liveStream.viewerCount.toLocaleString()} watching · Tap to join`
                : `${campus.city} · Streams, clips & messages`}
            </p>
            <span className="mt-4 inline-flex items-center gap-2 rounded-full bg-white px-4 py-2.5 text-sm font-bold text-night-900 shadow-xl transition duration-300 group-hover:scale-[1.03] group-active:scale-[0.98]">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-red-500 to-rose-600 text-sm text-white">
                ▶
              </span>
              Open media hub
            </span>
          </div>
        </div>
      </Link>

      {devotion && (
        <section className="overflow-hidden rounded-[1.75rem] bg-white shadow-lg ring-1 ring-night-900/5">
          <div className="h-1.5 bg-gradient-to-r from-amber-400 via-rose-500 to-violet-600" />
          <div className="p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-amber-700/80">
                  Today · {devotion.readingTime}
                </p>
                <h2 className="mt-1.5 font-display text-xl font-bold leading-snug text-night-900">
                  {devotion.title}
                </h2>
              </div>
              {completed && (
                <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-[11px] font-bold text-emerald-800">
                  Done
                </span>
              )}
            </div>

            <blockquote className="mt-3 text-sm italic leading-relaxed text-night-700">
              &ldquo;{devotion.verse}&rdquo;
              <footer className="mt-1 not-italic text-xs font-semibold text-night-500">
                {devotion.reference}
              </footer>
            </blockquote>

            <div className="mt-4 flex gap-2">
              <button
                type="button"
                onClick={() => setCompleted(true)}
                className="flex-1 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 px-4 py-2.5 text-sm font-bold text-white shadow-md shadow-amber-500/25 transition active:scale-[0.98]"
              >
                {completed ? "Completed ✓" : "Mark read"}
              </button>
              <Link
                href="/devotions"
                className="flex flex-1 items-center justify-center rounded-xl bg-night-900 px-4 py-2.5 text-sm font-bold text-white transition active:scale-[0.98]"
              >
                Read full
              </Link>
            </div>
          </div>
        </section>
      )}

      <section>
        <p className="mb-3 px-1 text-[11px] font-bold uppercase tracking-[0.22em] text-night-500">
          Quick steps
        </p>
        <div className="grid grid-cols-2 gap-3">
          {mobileQuickActions.map((action) => (
            <Link
              key={action.label}
              href={action.href}
              className={`group relative overflow-hidden rounded-2xl bg-gradient-to-br ${action.tone} p-4 text-white shadow-lg ${action.glow} transition duration-300 hover:-translate-y-0.5 active:scale-[0.98]`}
            >
              <div className="pointer-events-none absolute -right-4 -top-4 h-20 w-20 rounded-full bg-white/20 blur-2xl transition group-hover:bg-white/30" />
              <span className="relative text-2xl drop-shadow-sm">{action.icon}</span>
              <p className="relative mt-3 text-base font-bold leading-tight">{action.label}</p>
              <p className="relative mt-0.5 text-xs font-medium text-white/80">{action.sub}</p>
            </Link>
          ))}
        </div>
      </section>

      {featuredPost && (
        <section className="overflow-hidden rounded-[1.75rem] bg-gradient-to-br from-night-900 via-night-800 to-indigo-950 p-[1px] shadow-xl">
          <div className="rounded-[calc(1.75rem-1px)] bg-white/95 p-5 backdrop-blur-sm">
            <div className="flex items-center justify-between gap-3">
              <h2 className="font-display text-lg font-bold text-night-900">Community pulse</h2>
              <Link
                href="/community"
                className="text-sm font-bold text-violet-700 hover:underline"
              >
                See all →
              </Link>
            </div>
            <Link
              href="/community"
              className="mt-3 block rounded-2xl bg-gradient-to-br from-sand-50 to-violet-50 p-4 ring-1 ring-night-900/5 transition active:scale-[0.99]"
            >
              <p className="text-xs font-bold uppercase tracking-wide text-violet-700/80">
                {featuredPost.type} · {featuredPost.author}
              </p>
              <p className="mt-2 line-clamp-3 text-base leading-relaxed text-night-800">
                {featuredPost.content}
              </p>
            </Link>
          </div>
        </section>
      )}

      <Link
        href="/guest"
        className="flex items-center justify-between gap-3 rounded-2xl border border-dashed border-emerald-400/50 bg-gradient-to-r from-emerald-50 to-teal-50 px-4 py-3.5 text-sm transition active:scale-[0.99]"
      >
        <span>
          <span className="font-bold text-emerald-900">First time here?</span>
          <span className="mt-0.5 block text-emerald-800/80">Connect as a guest — no account needed</span>
        </span>
        <span className="rounded-full bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white">
          /guest
        </span>
      </Link>
    </div>
  );
}
