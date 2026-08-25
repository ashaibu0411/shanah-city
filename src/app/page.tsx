import { Suspense } from "react";
import { HomeView } from "@/components/home/HomeView";
import { getTodayDevotion } from "@/lib/devotion-server";
import { getChurchSocialImages } from "@/lib/facebook-church-media";
import { getCommunityPostsForViewer } from "@/lib/member-server";
import { getActiveUrgentAlert } from "@/lib/urgent-alert-server";
import { getChannelSermons } from "@/lib/youtube-sermons-server";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [posts, todayDevotion, urgentAlert, churchImages, sermonVideos] = await Promise.all([
    getCommunityPostsForViewer(null),
    getTodayDevotion(),
    getActiveUrgentAlert(),
    getChurchSocialImages(),
    getChannelSermons(),
  ]);

  return (
    <Suspense fallback={<p className="text-sm text-night-600">Loading…</p>}>
      <HomeView
        posts={posts}
        todayDevotion={todayDevotion}
        urgentAlert={urgentAlert}
        churchImages={churchImages}
        latestSermon={sermonVideos[0] ?? null}
      />
    </Suspense>
  );
}
