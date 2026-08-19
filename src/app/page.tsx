import { HomeView } from "@/components/home/HomeView";
import { getTodayDevotion } from "@/lib/devotion-server";
import { getEvents } from "@/lib/event-server";
import { getCommunityPostsForViewer } from "@/lib/member-server";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [posts, todayDevotion, events] = await Promise.all([
    getCommunityPostsForViewer(null),
    getTodayDevotion(),
    getEvents({ groupId: null }),
  ]);

  return <HomeView posts={posts} todayDevotion={todayDevotion} events={events} />;
}
