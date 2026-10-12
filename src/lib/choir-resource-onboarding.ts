import { SHANAH_WORSHIP_GROUP_ID } from "@/lib/choir-group-constants";

export type ChoirOnboardingLink = {
  id: string;
  title: string;
  description: string;
  href: string;
};

export function choirOnboardingLinks(groupId: string = SHANAH_WORSHIP_GROUP_ID): ChoirOnboardingLink[] {
  const g = encodeURIComponent(groupId);
  return [
    {
      id: "vision",
      title: "Welcome & ministry vision",
      description: "Start on the worship home page and team announcements.",
      href: `/groups/${g}`,
    },
    {
      id: "readiness",
      title: "Before You Serve training",
      description: "Complete the existing ministry readiness workflow when required.",
      href: `/groups/${g}?training=1`,
    },
    {
      id: "academy",
      title: "Worship Academy",
      description: "Optional growth courses — separate from readiness requirements.",
      href: `/groups/${g}/academy`,
    },
    {
      id: "setlists",
      title: "Setlists & song library",
      description: "Assigned music and preparation resources.",
      href: `/groups/${g}/setlists`,
    },
    {
      id: "song-suggestions",
      title: "Song suggestions",
      description: "Recommend songs for worship leadership to consider.",
      href: `/groups/${g}/song-suggestions`,
    },
    {
      id: "calendar",
      title: "Worship calendar",
      description: "Services, rehearsals, and your schedule.",
      href: `/groups/${g}/calendar`,
    },
    {
      id: "availability",
      title: "Availability center",
      description: "Share when you can serve on upcoming dates.",
      href: `/groups/${g}/availability`,
    },
    {
      id: "connect",
      title: "Team Connect",
      description: "Chat, announcements, and polls.",
      href: `/groups/${g}/connect`,
    },
    {
      id: "planner",
      title: "Worship planner",
      description: "Service plans for rostered team members.",
      href: "/worship",
    },
    {
      id: "team",
      title: "Worship team & assignments",
      description: "Your role and upcoming services.",
      href: `/groups/${g}/team`,
    },
  ];
}

export function choirBuiltinHelpfulLinks(groupId: string = SHANAH_WORSHIP_GROUP_ID) {
  const g = encodeURIComponent(groupId);
  return [
    { title: "Worship training videos", description: "Open Worship Academy courses", href: `/groups/${g}/academy` },
    { title: "Bible study resources", description: "Church devotions", href: "/devotions" },
    { title: "Rehearsal room", description: "Practice tracks and charts", href: `/groups/${g}/rehearsal` },
    { title: "Team Connect", description: "Official announcements", href: `/groups/${g}/connect?tab=announcements` },
    {
      title: "Song suggestions",
      description: "Recommend worship songs for leadership review",
      href: `/groups/${g}/song-suggestions`,
    },
  ];
}
