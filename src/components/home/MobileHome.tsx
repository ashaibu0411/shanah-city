"use client";

import Link from "next/link";
import { useState } from "react";
import { useApp } from "@/components/app/AppProvider";
import { StreamPreviewImage } from "@/components/live/StreamPreviewImage";
import { liveStream, site } from "@/lib/site";
import { streamPreviews } from "@/lib/streams";
import type { Devotion } from "@/lib/types";
import type { CommunityPost } from "@/lib/member-types";
import { Badge, Button } from "@/components/ui";

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
  const preview = streamPreviews[0];
  const anyLive =
    liveStream.isLive ||
    liveStream.youtube.isLive ||
    liveStream.facebook.isLive;

  return (
    <div className="space-y-4 pb-6">
      <section className="rounded-3xl bg-gradient-to-br from-night-950 to-night-800 p-5 text-white shadow-lg">
        <p className="text-xs font-semibold uppercase tracking-wider text-sand-300">
          {campus.name}
        </p>
        <p className="mt-2 text-sm leading-relaxed text-white/80">{site.tagline}</p>
        <p className="mt-3 text-xs text-white/60">
          {site.serviceTimes[0].day} · {site.serviceTimes[0].time}
        </p>
      </section>

      <Link
        href="/live"
        className="block overflow-hidden rounded-3xl bg-night-950 text-white shadow-md ring-1 ring-night-900/10"
      >
        <div className="relative aspect-[16/9]">
          <StreamPreviewImage
            preview={preview}
            alt="Live stream preview"
            className="h-full w-full object-cover opacity-90"
          />
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-night-950/45 px-4 text-center">
            {anyLive ? (
              <Badge variant="live">
                <span className="h-1.5 w-1.5 rounded-full bg-white" />
                Live now
              </Badge>
            ) : (
              <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-semibold">
                Next service
              </span>
            )}
            <p className="mt-3 font-display text-xl font-semibold">
              {anyLive ? liveStream.title : "Watch Shanah City"}
            </p>
            <p className="mt-1 text-sm text-white/75">
              {campus.city} · YouTube, Facebook &amp; Instagram
            </p>
            <span className="mt-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-white text-lg text-night-900 shadow-lg">
              ▶
            </span>
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
            <h2 className="mt-2 font-display text-xl font-semibold text-night-900">
              {devotion.title}
            </h2>
          </div>
          {completed && (
            <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-[10px] font-semibold text-emerald-700">
              Done
            </span>
          )}
        </div>

        <blockquote className="mt-4 border-l-4 border-sand-400 pl-3 text-sm italic text-night-700">
          &ldquo;{devotion.verse}&rdquo;
          <footer className="mt-1 not-italic text-xs font-semibold text-night-500">
            {devotion.reference}
          </footer>
        </blockquote>

        <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-night-600">
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
            <span className="text-xl">{action.icon}</span>
            <p className="mt-3 text-sm font-semibold">{action.label}</p>
          </Link>
        ))}
      </div>

      {posts.length > 0 && (
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-display text-lg font-semibold text-night-900">
              Community
            </h2>
            <Link href="/community" className="text-sm font-semibold text-night-600">
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
                <p className="text-xs font-semibold capitalize text-night-500">
                  {post.type} · {post.author}
                </p>
                <p className="mt-2 line-clamp-2 text-sm text-night-700">{post.content}</p>
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
          <span className="text-xl">✓</span>
          <p className="mt-2 text-sm font-semibold text-night-900">Check-in</p>
        </Link>
        <Link
          href="/calendar"
          className="rounded-2xl bg-white p-4 text-center ring-1 ring-night-900/5"
        >
          <span className="text-xl">◷</span>
          <p className="mt-2 text-sm font-semibold text-night-900">Calendar</p>
        </Link>
      </div>
    </div>
  );
}
