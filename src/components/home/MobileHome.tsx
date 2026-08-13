"use client";

import Link from "next/link";
import { useState } from "react";
import { useApp } from "@/components/app/AppProvider";
import { liveStream, site } from "@/lib/site";
import type { Devotion } from "@/lib/types";
import type { CommunityPost } from "@/lib/member-types";
import { Button } from "@/components/ui";

const quickActions = [
  { label: "Watch live", href: "/live", icon: "▶", tone: "from-red-500 to-rose-600" },
  { label: "Devotion", href: "/devotions", icon: "✦", tone: "from-amber-500 to-orange-600" },
  { label: "Plan a visit", href: "/connect", icon: "▣", tone: "from-blue-500 to-indigo-600" },
  { label: "Prayer wall", href: "/community", icon: "♡", tone: "from-emerald-500 to-teal-600" },
  { label: "Give", href: "/give", icon: "♢", tone: "from-violet-500 to-purple-600" },
];

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

  return (
    <div className="space-y-4 pb-6">
      <section className="rounded-3xl bg-gradient-to-br from-night-950 via-night-800 to-night-900 p-5 text-white shadow-lg">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-200/90">
          {campus.name}
        </p>
        <p className="mt-3 font-display text-lg font-semibold leading-snug text-white sm:text-xl">
          {site.tagline}
        </p>
        <p className="mt-3 text-sm text-white/70">
          {site.serviceTimes[0].day} · {site.serviceTimes[0].time}
        </p>
      </section>

      <Link
        href="/live"
        className="group block overflow-hidden rounded-3xl shadow-lg ring-1 ring-night-900/10 transition hover:shadow-xl"
      >
        <div className="relative aspect-[16/10] overflow-hidden bg-gradient-to-br from-amber-400 via-rose-500 to-violet-700">
          <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-yellow-200/30 blur-2xl" />
          <div className="pointer-events-none absolute -bottom-8 left-0 h-32 w-32 rounded-full bg-fuchsia-400/25 blur-2xl" />
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.22),transparent_45%)]" />

          <div className="relative flex h-full flex-col justify-between p-5">
            <div className="flex flex-wrap items-center gap-2">
              {anyLive ? (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1 text-xs font-bold uppercase tracking-wide text-red-600 shadow-sm">
                  <span className="h-2 w-2 animate-pulse rounded-full bg-red-600" />
                  Live now
                </span>
              ) : (
                <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-semibold text-white backdrop-blur-sm">
                  Next service
                </span>
              )}
              <span className="rounded-full bg-[#FF0000] px-2.5 py-1 text-[11px] font-bold text-white shadow-sm">
                YouTube
              </span>
              <span className="rounded-full bg-gradient-to-r from-fuchsia-500 to-orange-400 px-2.5 py-1 text-[11px] font-bold text-white shadow-sm">
                Instagram
              </span>
            </div>

            <div>
              <p className="font-display text-2xl font-bold leading-tight text-white drop-shadow-sm">
                {anyLive ? liveStream.title : "Watch & worship with us"}
              </p>
              <p className="mt-2 text-base text-white/90">
                {campus.city} · Messages, live streams &amp; clips
              </p>
              <span className="mt-4 inline-flex items-center gap-2 rounded-full bg-white px-4 py-2.5 text-sm font-bold text-night-900 shadow-md transition group-hover:scale-[1.02]">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-red-600 text-sm text-white">
                  ▶
                </span>
                Open media hub
              </span>
            </div>
          </div>
        </div>
      </Link>

      {devotion && (
        <section className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-night-900/5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-sand-600">
                Today · {devotion.readingTime}
              </p>
              <h2 className="mt-2 font-display text-xl font-semibold text-night-900 sm:text-2xl">
                {devotion.title}
              </h2>
            </div>
            {completed && (
              <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                Done
              </span>
            )}
          </div>

          <blockquote className="mt-4 border-l-4 border-sand-400 pl-3 text-base italic leading-relaxed text-night-700">
            &ldquo;{devotion.verse}&rdquo;
            <footer className="mt-1 not-italic text-sm font-semibold text-night-500">
              {devotion.reference}
            </footer>
          </blockquote>

          <p className="mt-3 line-clamp-3 text-base leading-relaxed text-night-600">
            {devotion.content}
          </p>

          <div className="mt-4 flex gap-2">
            <Button className="flex-1" onClick={() => setCompleted(true)}>
              {completed ? "Completed" : "Mark read"}
            </Button>
            <Button href="/devotions" variant="secondary" className="flex-1">
              Open
            </Button>
          </div>
        </section>
      )}

      <div className="grid grid-cols-2 gap-3">
        {quickActions.map((action) => (
          <Link
            key={action.label}
            href={action.href}
            className={`rounded-2xl bg-gradient-to-br ${action.tone} p-4 text-white shadow-sm`}
          >
            <span className="text-2xl">{action.icon}</span>
            <p className="mt-3 text-base font-semibold">{action.label}</p>
          </Link>
        ))}
      </div>

      {posts.length > 0 && (
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-display text-xl font-semibold text-night-900">
              Community
            </h2>
            <Link href="/community" className="text-base font-semibold text-night-600">
              See all →
            </Link>
          </div>
          <div className="space-y-3">
            {posts.slice(0, 2).map((post) => (
              <Link
                key={post.id}
                href="/community"
                className="block rounded-2xl bg-white p-4 ring-1 ring-night-900/5"
              >
                <p className="text-sm font-semibold capitalize text-night-500">
                  {post.type} · {post.author}
                </p>
                <p className="mt-2 line-clamp-2 text-base text-night-700">{post.content}</p>
              </Link>
            ))}
          </div>
        </section>
      )}

      <div className="grid grid-cols-2 gap-3">
        <Link
          href="/check-in"
          className="rounded-2xl bg-white p-4 text-center ring-1 ring-night-900/5"
        >
          <span className="text-2xl">✓</span>
          <p className="mt-2 text-base font-semibold text-night-900">Check-in</p>
        </Link>
        <Link
          href="/calendar"
          className="rounded-2xl bg-white p-4 text-center ring-1 ring-night-900/5"
        >
          <span className="text-2xl">◷</span>
          <p className="mt-2 text-base font-semibold text-night-900">Calendar</p>
        </Link>
      </div>
    </div>
  );
}
