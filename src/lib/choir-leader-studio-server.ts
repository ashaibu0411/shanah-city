import type { PublicMember } from "@/lib/auth-types";
import { canManageAsAdmin } from "@/lib/admin-access-server";
import { buildChoirCalendarPagePayload } from "@/lib/choir-calendar-server";
import type { ChoirCalendarEvent } from "@/lib/choir-calendar-types";
import { choirAvailabilityTeamHref } from "@/lib/choir-availability-links";
import { choirWorshipEventsHref } from "@/lib/choir-events-links";
import type {
  LeaderStudioActivityRow,
  LeaderStudioOverviewPayload,
  LeaderStudioPendingRow,
  LeaderStudioUpcomingRow,
} from "@/lib/choir-leader-studio-types";
import { SHANAH_WORSHIP_GROUP_ID, choirPlanKey } from "@/lib/choir-group-constants";
import { choirResourcesManageHref, choirResourcesHref } from "@/lib/choir-resource-links";
import { choirSongSuggestionReviewHref } from "@/lib/choir-song-suggestion-links";
import { buildChoirTeamPagePayload } from "@/lib/choir-team-server";
import { canManageGroupEvents } from "@/lib/group-permissions-server";
import { canManageWorshipPlan } from "@/lib/worship-access-server";
import { listWorshipPlans } from "@/lib/worship-server";
import {
  listChoirScheduleChangeRequestsJson,
  listChoirAvailabilityResponsesForGroupJson,
} from "@/lib/stores/choir-availability-json";
import { listChoirEventTeamInterestsJson } from "@/lib/stores/choir-events-json";
import { listChoirSongSuggestionsJson } from "@/lib/stores/choir-song-suggestions-json";
import {
  listChoirMinistryResourcesJson,
  listChoirResourceRequestsJson,
} from "@/lib/stores/choir-ministry-resources-json";

export { parseLeaderStudioTab } from "@/lib/choir-leader-studio-links";

export async function canAccessChoirLeaderStudio(user: PublicMember, groupId: string) {
  if (groupId !== SHANAH_WORSHIP_GROUP_ID) return false;
  if (await canManageAsAdmin(user)) return true;
  if (await canManageWorshipPlan(user)) return true;
  return canManageGroupEvents(user, groupId);
}

function relativeWhen(iso: string) {
  const then = new Date(iso).getTime();
  const hours = Math.floor((Date.now() - then) / 3_600_000);
  if (hours < 1) return "Just now";
  if (hours === 1) return "1 hour ago";
  if (hours < 24) return `${hours} hours ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "1 day ago";
  return `${days} days ago`;
}

function planningStatus(
  event: ChoirCalendarEvent,
  planStatusByKey: Map<string, string>,
): Pick<LeaderStudioUpcomingRow, "statusLabel" | "statusTone"> {
  if (event.sourceType === "worship-plan" || event.sourceType === "worship-rehearsal") {
    const key = event.worshipPlanKey ?? event.sourceId;
    const status = key ? planStatusByKey.get(key) : undefined;
    if (status === "published") {
      return { statusLabel: "Confirmed", statusTone: "confirmed" };
    }
    if (status === "draft") {
      return { statusLabel: "Needs plan", statusTone: "needs_plan" };
    }
  }
  return { statusLabel: "Pending", statusTone: "pending" };
}

function datePartsFromKey(dateKey: string) {
  const day = new Date(`${dateKey}T12:00:00`);
  if (Number.isNaN(day.getTime())) {
    return { monthLabel: "TBD", dayLabel: "—", weekdayLabel: "", dateLabel: "Date TBA" };
  }
  return {
    monthLabel: day.toLocaleDateString(undefined, { month: "short" }).toUpperCase(),
    dayLabel: String(day.getDate()),
    weekdayLabel: day.toLocaleDateString(undefined, { weekday: "short" }),
    dateLabel: day.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" }),
  };
}

function toUpcomingRow(
  event: ChoirCalendarEvent,
  groupId: string,
  planStatusByKey: Map<string, string>,
): LeaderStudioUpcomingRow {
  const parts = datePartsFromKey(event.dateKey);
  const status = planningStatus(event, planStatusByKey);
  const detailHref =
    event.worshipPlanKey && event.serviceDate && event.serviceTime
      ? `/worship?date=${encodeURIComponent(event.serviceDate)}&time=${encodeURIComponent(event.serviceTime)}`
      : `/groups/${encodeURIComponent(groupId)}/calendar?event=${encodeURIComponent(event.id)}`;

  return {
    id: event.id,
    title: event.title,
    monthLabel: parts.monthLabel,
    dayLabel: parts.dayLabel,
    weekdayLabel: parts.weekdayLabel,
    timeLabel: event.timeLabel,
    location: event.location,
    teamLabel: event.teamLabel ?? "Worship team",
    ...status,
    detailHref,
  };
}

export async function buildLeaderStudioOverviewPayload(
  user: PublicMember,
  groupId: string,
): Promise<LeaderStudioOverviewPayload | null> {
  if (!(await canAccessChoirLeaderStudio(user, groupId))) return null;

  const calendar = await buildChoirCalendarPagePayload(user, groupId);
  const team = await buildChoirTeamPagePayload(user, groupId);
  if (!calendar || !team) return null;

  const nowMs = Date.now();
  const plans = await listWorshipPlans({ since: new Date(Date.now() - 30 * 86_400_000).toISOString().slice(0, 10) });
  const planStatusByKey = new Map<string, string>();
  for (const plan of plans) {
    planStatusByKey.set(choirPlanKey(plan.serviceDate, plan.serviceTime), plan.status);
  }

  const upcomingEvents = calendar.events
    .filter(
      (event) =>
        (event.category === "service" || event.category === "rehearsal") &&
        event.startsAtMs >= nowMs - 3_600_000,
    )
    .sort((a, b) => a.startsAtMs - b.startsAtMs)
    .slice(0, 3);

  const upcoming = upcomingEvents.map((event) => toUpcomingRow(event, groupId, planStatusByKey));

  const pendingChanges = (await listChoirScheduleChangeRequestsJson(groupId)).filter(
    (row) => row.status === "pending",
  );
  const suggestions = await listChoirSongSuggestionsJson(groupId);
  const pendingSuggestions = suggestions.filter(
    (row) => row.status === "submitted" || row.status === "under_review" || row.status === "needs_more_info",
  );
  const teamInterests = await listChoirEventTeamInterestsJson(groupId);
  const openTeamInterests = teamInterests.filter(
    (row) => row.status === "interested" || row.status === "pending_review",
  );
  const resourceRequests = (await listChoirResourceRequestsJson(groupId)).filter(
    (row) => row.status === "submitted" || row.status === "under_review",
  );

  const memberIds = team.teamMembers.map((member) => member.userId);
  const allResponses = await listChoirAvailabilityResponsesForGroupJson(groupId);
  const focusEvent = calendar.events
    .filter((event) => event.category === "service" && event.startsAtMs >= nowMs - 86_400_000)
    .sort((a, b) => a.startsAtMs - b.startsAtMs)[0];

  let availability: LeaderStudioOverviewPayload["availability"] = null;
  if (focusEvent) {
    const responses = allResponses.filter((row) => row.eventId === focusEvent.id);
    let available = 0;
    let unavailable = 0;
    let maybe = 0;
    let responded = 0;
    for (const memberId of memberIds) {
      const row = responses.find((entry) => entry.memberId === memberId);
      if (!row) continue;
      responded += 1;
      if (row.response === "available") available += 1;
      if (row.response === "unavailable") unavailable += 1;
      if (row.response === "maybe") maybe += 1;
    }
    const parts = datePartsFromKey(focusEvent.dateKey);
    availability = {
      eventTitle: focusEvent.title,
      eventDateLabel: parts.dateLabel,
      eligible: memberIds.length,
      available,
      maybe,
      unavailable,
      notResponded: Math.max(0, memberIds.length - responded),
      viewHref: choirAvailabilityTeamHref(groupId),
    };
  }

  const pendingItems: LeaderStudioPendingRow[] = [];
  if (pendingChanges.length) {
    pendingItems.push({
      id: "schedule-changes",
      label: "Schedule change requests",
      count: pendingChanges.length,
      href: choirAvailabilityTeamHref(groupId),
    });
  }
  if (pendingSuggestions.length) {
    pendingItems.push({
      id: "song-suggestions",
      label: "Song suggestions to review",
      count: pendingSuggestions.length,
      href: choirSongSuggestionReviewHref(groupId),
    });
  }
  if (availability && availability.notResponded > 0) {
    pendingItems.push({
      id: "availability",
      label: "Members awaiting availability",
      count: availability.notResponded,
      href: choirAvailabilityTeamHref(groupId),
    });
  }
  if (openTeamInterests.length) {
    pendingItems.push({
      id: "event-teams",
      label: "Event team requests",
      count: openTeamInterests.length,
      href: choirWorshipEventsHref(groupId, { tab: "teams" }),
    });
  }

  const activity: LeaderStudioActivityRow[] = [];
  for (const row of pendingChanges.slice(0, 5)) {
    activity.push({
      id: `change-${row.id}`,
      icon: "↺",
      text: `${row.memberName} requested a schedule change`,
      whenLabel: relativeWhen(row.createdAt),
      href: choirAvailabilityTeamHref(groupId),
    });
  }
  for (const row of suggestions.slice(0, 5)) {
    activity.push({
      id: `song-${row.id}`,
      icon: "♫",
      text: `${row.submittedByName} suggested “${row.title}”`,
      whenLabel: relativeWhen(row.createdAt),
      href: choirSongSuggestionReviewHref(groupId),
    });
  }
  for (const row of openTeamInterests.slice(0, 5)) {
    activity.push({
      id: `team-${row.id}`,
      icon: "★",
      text: `${row.userName} requested to serve at an event`,
      whenLabel: relativeWhen(row.createdAt),
      href: choirWorshipEventsHref(groupId, { tab: "teams" }),
    });
  }
  for (const row of resourceRequests.slice(0, 5)) {
    activity.push({
      id: `resource-${row.id}`,
      icon: "📖",
      text: `${row.userName} requested a ministry resource`,
      whenLabel: relativeWhen(row.createdAt),
      href: choirResourcesManageHref(groupId),
    });
  }

  activity.sort((a, b) => {
    const parse = (label: string) => {
      if (label === "Just now") return Date.now();
      const hour = label.match(/^(\d+) hour/);
      if (hour) return Date.now() - Number(hour[1]) * 3_600_000;
      const day = label.match(/^(\d+) day/);
      if (day) return Date.now() - Number(day[1]) * 86_400_000;
      return 0;
    };
    return parse(b.whenLabel) - parse(a.whenLabel);
  });

  const resources = (await listChoirMinistryResourcesJson(groupId)).filter(
    (row) => row.status === "published",
  );

  return {
    groupId,
    groupChatHref: `/groups/${encodeURIComponent(groupId)}?chat=1`,
    upcoming,
    pendingItems: pendingItems.slice(0, 4),
    availability,
    recentActivity: activity.slice(0, 3),
    songSuggestions: {
      pendingCount: pendingSuggestions.length,
      href: choirSongSuggestionReviewHref(groupId),
      manageHref: choirSongSuggestionReviewHref(groupId),
    },
    eventTeams: {
      openCount: openTeamInterests.length,
      href: choirWorshipEventsHref(groupId, { tab: "teams" }),
    },
    ministryResources: {
      pendingRequests: resourceRequests.length,
      resourceCount: resources.length,
      href: choirResourcesHref(groupId),
      manageHref: choirResourcesManageHref(groupId),
    },
    reportsHref: "/ministry-reports",
    calendarViewAllHref: `/groups/${encodeURIComponent(groupId)}/calendar`,
    plannerHref: "/worship",
  };
}
