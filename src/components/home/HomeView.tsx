"use client";

import { useLayoutEffect, useState } from "react";
import { useAppShell } from "@/components/app/AppShellContext";
import { PremiumHomeDesktop } from "@/components/home/premium/PremiumHomeDesktop";
import { PremiumHomeMobile } from "@/components/home/premium/PremiumHomeMobile";
import { useUrgentAlertHighlight } from "@/components/home/useUrgentAlertHighlight";
import type { UrgentAlert } from "@/lib/urgent-alert-types";

import type { ChurchSocialImages } from "@/lib/facebook-church-media";
import type { HomeUpcomingEventRow } from "@/lib/home-upcoming-events";
import type { SermonVideo } from "@/lib/youtube-sermons-server";
import type { Devotion } from "@/lib/types";

type HomeViewProps = {
  urgentAlerts: UrgentAlert[];
  churchImages: ChurchSocialImages;
  latestSermon?: SermonVideo | null;
  upcomingEventRows?: HomeUpcomingEventRow[];
  todayDevotion?: Devotion | null;
};

export function HomeView({
  urgentAlerts,
  churchImages,
  latestSermon = null,
  upcomingEventRows = [],
  todayDevotion = null,
}: HomeViewProps) {
  const { isMobileApp } = useAppShell();
  const [layoutReady, setLayoutReady] = useState(false);
  const highlightAlertId = useUrgentAlertHighlight(urgentAlerts);

  useLayoutEffect(() => {
    setLayoutReady(true);
  }, []);

  const shared = {
    urgentAlerts,
    highlightAlertId,
    churchImages,
    latestSermon,
    upcomingEventRows,
    todayDevotion,
  };

  if (!layoutReady) {
    return (
      <div
        className="min-h-[12rem] bg-[#f8f7f4] dark:bg-[#061329]"
        aria-busy="true"
        aria-label="Loading home"
      />
    );
  }

  if (isMobileApp) {
    return <PremiumHomeMobile {...shared} latestSermon={latestSermon} />;
  }

  return <PremiumHomeDesktop {...shared} latestSermon={latestSermon} />;
}
