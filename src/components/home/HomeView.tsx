"use client";

import { CommunityPreview } from "@/components/community/CommunityFeed";
import { DevotionPreview } from "@/components/devotions/DevotionCard";
import { useAppShell } from "@/components/app/AppShellContext";
import { CampusStrip } from "@/components/home/CampusStrip";
import { HomeHero } from "@/components/home/HomeHero";
import { LiveBanner } from "@/components/home/LiveBanner";
import { MobileHome } from "@/components/home/MobileHome";
import { QuickActions } from "@/components/home/QuickActions";
import { PendingRsvpHomeBanner } from "@/components/home/PendingRsvpHomeBanner";
import { UrgentAlertBanner } from "@/components/home/UrgentAlertBanner";
import { useUrgentAlertHighlight } from "@/components/home/useUrgentAlertHighlight";
import { PrayerHomeBanner } from "@/components/meetings/PrayerHomeBanner";
import { SermonCard } from "@/components/sermons/SermonCard";
import { SectionTitle } from "@/components/ui";
import type { Devotion } from "@/lib/types";
import type { CommunityPost } from "@/lib/member-types";
import type { UrgentAlert } from "@/lib/urgent-alert-types";

import type { ChurchSocialImages } from "@/lib/facebook-church-media";

type HomeViewProps = {
  posts: CommunityPost[];
  todayDevotion: Devotion | null;
  urgentAlert: UrgentAlert | null;
  churchImages: ChurchSocialImages;
};

export function HomeView({
  posts,
  todayDevotion,
  urgentAlert,
  churchImages,
}: HomeViewProps) {
  const { isMobileApp } = useAppShell();
  const highlightAlert = useUrgentAlertHighlight(urgentAlert);

  if (isMobileApp) {
    return (
      <MobileHome
        posts={posts}
        todayDevotion={todayDevotion}
        urgentAlert={urgentAlert}
        churchImages={churchImages}
        highlightAlert={highlightAlert}
      />
    );
  }

  return (
    <>
      <UrgentAlertBanner alert={urgentAlert} highlighted={highlightAlert} />
      <HomeHero />
      <LiveBanner />
      <PendingRsvpHomeBanner />
      <QuickActions />
      <CampusStrip />
      {todayDevotion ? <DevotionPreview devotion={todayDevotion} /> : null}
      <PrayerHomeBanner />

      <section className="mb-8">
        <SectionTitle title="Latest sermon" href="/sermons" />
        <SermonCard compact />
      </section>

      <CommunityPreview initialPosts={posts} />
    </>
  );
}
