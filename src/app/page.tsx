import { Suspense } from "react";
import { redirect } from "next/navigation";
import { HomeView } from "@/components/home/HomeView";
import { getTodayDevotion } from "@/lib/devotion-server";
import { getChurchSocialImages } from "@/lib/facebook-church-media";
import { listUrgentAlertsForHomeCarousel } from "@/lib/urgent-alert-server";
import { getChannelSermons } from "@/lib/youtube-sermons-server";

export const dynamic = "force-dynamic";

type HomePageProps = {
  searchParams: Promise<{ alert?: string }>;
};

export default async function HomePage({ searchParams }: HomePageProps) {
  const { alert } = await searchParams;
  if (alert?.trim()) {
    redirect(`/alerts/${encodeURIComponent(alert.trim())}`);
  }

  const [todayDevotion, urgentAlerts, churchImages, sermonVideos] = await Promise.all([
    getTodayDevotion(),
    listUrgentAlertsForHomeCarousel(),
    getChurchSocialImages(),
    getChannelSermons(),
  ]);

  return (
    <Suspense fallback={<p className="text-sm text-night-600">Loading…</p>}>
      <HomeView
        todayDevotion={todayDevotion}
        urgentAlerts={urgentAlerts}
        churchImages={churchImages}
        latestSermon={sermonVideos[0] ?? null}
      />
    </Suspense>
  );
}
