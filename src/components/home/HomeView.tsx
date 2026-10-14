"use client";

import { useAppShell } from "@/components/app/AppShellContext";
import { CampusStrip } from "@/components/home/CampusStrip";
import { HomeHero } from "@/components/home/HomeHero";
import { LiveBanner } from "@/components/home/LiveBanner";
import { MobileHome } from "@/components/home/MobileHome";
import { QuickActions } from "@/components/home/QuickActions";
import { PendingRsvpHomeBanner } from "@/components/home/PendingRsvpHomeBanner";
import { UrgentNewsHomeStrip } from "@/components/home/UrgentNewsHomeStrip";
import {
  AnniversaryHomeBanner,
  CheckInHomeBanner,
  LeaderReportHomeBanner,
  FollowUpHomeBanner,
  TrainingHomeBanner,
} from "@/components/home/DailyEngagementBanners";
import { useUrgentAlertHighlight } from "@/components/home/useUrgentAlertHighlight";
import { HomeStoriesSection } from "@/components/home/HomeStoriesSection";
import { PrayerHomeBanner } from "@/components/meetings/PrayerHomeBanner";
import { SermonCard } from "@/components/sermons/SermonCard";
import { SectionTitle } from "@/components/ui";
import type { UrgentAlert } from "@/lib/urgent-alert-types";

import type { ChurchSocialImages } from "@/lib/facebook-church-media";
import type { HomeUpcomingEventRow } from "@/lib/home-upcoming-events";
import type { SermonVideo } from "@/lib/youtube-sermons-server";

type HomeViewProps = {
  urgentAlerts: UrgentAlert[];
  churchImages: ChurchSocialImages;
  latestSermon?: SermonVideo | null;
  upcomingEventRows?: HomeUpcomingEventRow[];
};

export function HomeView({
  urgentAlerts,
  churchImages,
  latestSermon = null,
  upcomingEventRows = [],
}: HomeViewProps) {
  const { isMobileApp } = useAppShell();
  const highlightAlertId = useUrgentAlertHighlight(urgentAlerts);

  if (isMobileApp) {
    return (
      <MobileHome
        urgentAlerts={urgentAlerts}
        churchImages={churchImages}
        highlightAlertId={highlightAlertId}
        latestSermon={latestSermon}
        upcomingEventRows={upcomingEventRows}
      />
    );
  }

  return (
    <>
      <UrgentNewsHomeStrip alerts={urgentAlerts} highlightAlertId={highlightAlertId} variant="desktop" />
      <HomeHero />
      <LiveBanner liveFlyerImage={churchImages.live} />
      <PendingRsvpHomeBanner />
      <LeaderReportHomeBanner />
      <TrainingHomeBanner />
      <FollowUpHomeBanner />
      <AnniversaryHomeBanner />
      <QuickActions />
      <CampusStrip />
      <CheckInHomeBanner />
      <PrayerHomeBanner />

      <section className="mb-8">
        <HomeStoriesSection />
      </section>

      <section className="mb-8">
        <SectionTitle title="Latest sermon" href="/sermons" />
        <SermonCard compact video={latestSermon} />
      </section>
    </>
  );
}
