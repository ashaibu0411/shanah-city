import { HomeView } from "@/components/home/HomeView";
import { getTodayDevotion } from "@/lib/devotion-server";
import { getEvents } from "@/lib/event-server";
import { getCommunityPosts } from "@/lib/member-server";

export default async function HomePage() {
  const [posts, todayDevotion, events] = await Promise.all([
    getCommunityPosts(),
    getTodayDevotion(),
    getEvents(),
  ]);

  return <HomeView posts={posts} todayDevotion={todayDevotion} events={events} />;
}
