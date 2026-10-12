export type LeaderStudioTabId =
  | "overview"
  | "planning"
  | "team"
  | "events"
  | "resources"
  | "reports";

export type LeaderStudioUpcomingRow = {
  id: string;
  title: string;
  monthLabel: string;
  dayLabel: string;
  weekdayLabel: string;
  timeLabel: string;
  location: string;
  teamLabel: string;
  statusLabel: string;
  statusTone: "confirmed" | "pending" | "needs_plan";
  detailHref: string;
};

export type LeaderStudioPendingRow = {
  id: string;
  label: string;
  count: number;
  href: string;
};

export type LeaderStudioActivityRow = {
  id: string;
  icon: string;
  text: string;
  whenLabel: string;
  href: string | null;
};

export type LeaderStudioOverviewPayload = {
  groupId: string;
  groupChatHref: string;
  upcoming: LeaderStudioUpcomingRow[];
  pendingItems: LeaderStudioPendingRow[];
  availability: {
    eventTitle: string;
    eventDateLabel: string;
    eligible: number;
    available: number;
    maybe: number;
    unavailable: number;
    notResponded: number;
    viewHref: string;
  } | null;
  recentActivity: LeaderStudioActivityRow[];
  songSuggestions: { pendingCount: number; href: string; manageHref: string };
  eventTeams: { openCount: number; href: string };
  ministryResources: { pendingRequests: number; resourceCount: number; href: string; manageHref: string };
  reportsHref: string;
  calendarViewAllHref: string;
  plannerHref: string;
};
