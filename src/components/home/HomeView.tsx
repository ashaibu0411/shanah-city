"use client";

import { useAppShell } from "@/components/app/AppShellContext";
import { PremiumHomeDesktop } from "@/components/home/premium/PremiumHomeDesktop";
import { PremiumHomeMobile } from "@/components/home/premium/PremiumHomeMobile";
import { useUrgentAlertHighlight } from "@/components/home/useUrgentAlertHighlight";
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

  const shared = {
    urgentAlerts,
    highlightAlertId,
    churchImages,
    latestSermon,
    upcomingEventRows,
  };

  if (isMobileApp) {
    return <PremiumHomeMobile {...shared} latestSermon={latestSermon} />;
  }

  return <PremiumHomeDesktop {...shared} latestSermon={latestSermon} />;
}
