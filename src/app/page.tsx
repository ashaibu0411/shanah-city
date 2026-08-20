import { HomeView } from "@/components/home/HomeView";
import { getTodayDevotion } from "@/lib/devotion-server";
import { getEvents } from "@/lib/event-server";
import { getCommunityPostsForViewer } from "@/lib/member-server";
import { getActiveUrgentAlert } from "@/lib/urgent-alert-server";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [posts, todayDevotion, events, urgentAlert] = await Promise.all([
    getCommunityPostsForViewer(null),
    getTodayDevotion(),
    getEvents({ groupId: null }),
    getActiveUrgentAlert(),
  ]);

  return (
    <HomeView
      posts={posts}
      todayDevotion={todayDevotion}
      events={events}
      urgentAlert={urgentAlert}
    />
  );
}
