import type { Metadata } from "next";
import { ChurchSiteHome } from "@/components/church-site/ChurchSiteHome";
import { getEvents } from "@/lib/event-server";
import { pickUpcomingHomeEventRows } from "@/lib/home-upcoming-events";
import { mergeHomeSermonVideo } from "@/lib/home-sermon-display";
import { getChannelSermons } from "@/lib/youtube-sermons-server";

export const metadata: Metadata = {
  title: "Shanah City Church | Welcome Home",
  description:
    "Visit Shanah City Church in Aurora, Colorado. Experience worship, God's Word, community, and a place to belong. Sundays at 10 AM.",
  alternates: { canonical: "https://shanahcity.org" },
  openGraph: {
    title: "Shanah City Church | Welcome Home",
    description: "Changing Lives to Higher Levels in God. Join us in Aurora, Colorado.",
    url: "https://shanahcity.org",
    siteName: "Shanah City Church",
    images: [{ url: "/home/home-gallery-01.jpg", width: 1200, height: 630 }],
  },
};

export const dynamic = "force-dynamic";

export default async function ChurchSitePage() {
  const [churchEvents, sermonVideos] = await Promise.all([
    getEvents({ groupId: null }),
    getChannelSermons(),
  ]);
  const upcomingEvents = pickUpcomingHomeEventRows(churchEvents, 3);
  const latestSermon = mergeHomeSermonVideo(null, sermonVideos);

  return (
    <ChurchSiteHome upcomingEvents={upcomingEvents} latestSermon={latestSermon} />
  );
}