import { HomeView } from "@/components/home/HomeView";
import { getTodayDevotion } from "@/lib/devotion-server";
import { getCommunityPosts } from "@/lib/member-server";

export default async function HomePage() {
  const [posts, todayDevotion] = await Promise.all([
    getCommunityPosts(),
    getTodayDevotion(),
  ]);

  return <HomeView posts={posts} todayDevotion={todayDevotion} />;
}
