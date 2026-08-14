"use client";

import { CommunityPreview } from "@/components/community/CommunityFeed";
import { DevotionPreview } from "@/components/devotions/DevotionCard";
import { useAppShell } from "@/components/app/AppShellContext";
import { CampusStrip } from "@/components/home/CampusStrip";
import { HomeHero } from "@/components/home/HomeHero";
import { LiveBanner } from "@/components/home/LiveBanner";
import { MobileHome } from "@/components/home/MobileHome";
import { QuickActions } from "@/components/home/QuickActions";
import { MeetingPreview } from "@/components/meetings/MeetingsList";
import { SermonCard } from "@/components/sermons/SermonCard";
import { SectionTitle } from "@/components/ui";
import type { Devotion, ChurchEvent } from "@/lib/types";
import type { CommunityPost } from "@/lib/member-types";

type HomeViewProps = {
  posts: CommunityPost[];
  todayDevotion: Devotion | null;
  events: ChurchEvent[];
};

export function HomeView({ posts, todayDevotion, events }: HomeViewProps) {
  const { isMobileApp } = useAppShell();

  if (isMobileApp) {
    return <MobileHome posts={posts} todayDevotion={todayDevotion} />;
  }

  return (
    <>
      <HomeHero />
      <LiveBanner />
      <QuickActions />
      <CampusStrip />
      {todayDevotion ? <DevotionPreview devotion={todayDevotion} /> : null}
      <MeetingPreview />

      <section className="mb-8">
        <SectionTitle title="Latest sermon" href="/sermons" />
        <SermonCard compact />
      </section>

      <section className="mb-8">
        <SectionTitle title="Upcoming" href="/calendar" />
        <div className="grid gap-3 md:grid-cols-3">
          {events.map((event) => (
            <div
              key={event.id}
              className="rounded-2xl bg-white p-4 ring-1 ring-night-900/5"
            >
              <p className="text-xs font-medium text-sand-600">{event.date}</p>
              <h3 className="mt-1 font-display text-lg font-semibold text-night-900">
                {event.title}
              </h3>
              <p className="mt-2 text-sm text-night-600">
                {event.time} · {event.location}
              </p>
            </div>
          ))}
        </div>
      </section>

      <CommunityPreview initialPosts={posts} />
    </>
  );
}
