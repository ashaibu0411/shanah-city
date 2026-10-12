import type { PublicMember } from "@/lib/auth-types";
import { canManageAsAdmin } from "@/lib/admin-access-server";
import { buildChoirCalendarPagePayload } from "@/lib/choir-calendar-server";
import type { ChoirCalendarEvent } from "@/lib/choir-calendar-types";
import { choirAvailabilityTeamHref } from "@/lib/choir-availability-links";
import type {
  ChoirAvailabilityCalendarDay,
  ChoirAvailabilityConflictKind,
  ChoirAvailabilityDisplayStatus,
  ChoirAvailabilityHomePayload,
  ChoirAvailabilityOpportunityView,
  ChoirAvailabilityPreferences,
  ChoirAvailabilityResponse,
  ChoirAvailabilityTabId,
  ChoirMySchedulePayload,
  ChoirMyScheduleRehearsalView,
  ChoirScheduleChangeRequest,
} from "@/lib/choir-availability-types";
import { DEFAULT_AVAILABILITY_GUIDELINES as DEFAULT_GUIDELINES } from "@/lib/choir-availability-types";
import { SHANAH_WORSHIP_GROUP_ID } from "@/lib/choir-group-constants";
import { buildChoirTeamPagePayload } from "@/lib/choir-team-server";
import type { ChoirTeamAssignmentView } from "@/lib/choir-team-types";
import { getGroupDetail } from "@/lib/group-server";
import { canManageGroupEvents } from "@/lib/group-permissions-server";
import { isMemberTrainingRequired } from "@/lib/ministry-readiness-server";
import { sendPushToUsers } from "@/lib/push-server";
import { isGroupLeaderOrAssistant } from "@/lib/group-admin-utils";
import { getGroups } from "@/lib/group-server";
import { listWorshipPlans } from "@/lib/worship-server";
import { site } from "@/lib/site";
import {
  combinePlanDateTime,
  serviceDateTimeLabel,
  worshipTimeLabel,
} from "@/lib/worship-types";
import {
  createChoirScheduleChangeRequestJson,
  getChoirAvailabilityDeadlinesJson,
  getChoirAvailabilityGuidelinesJson,
  getChoirAvailabilityResponseJson,
  getChoirAvailabilityPreferencesJson,
  listChoirAvailabilityResponsesForGroupJson,
  listChoirAvailabilityResponsesForMemberJson,
  listChoirScheduleChangeRequestsJson,
  saveChoirAvailabilityGuidelinesJson,
  saveChoirAvailabilityPreferencesJson,
  updateChoirScheduleChangeRequestJson,
  upsertChoirAvailabilityResponseJson,
} from "@/lib/stores/choir-availability-json";

function availabilityLabel(status: ChoirAvailabilityDisplayStatus) {
  switch (status) {
    case "available":
      return "Available";
    case "unavailable":
      return "Unavailable";
    case "maybe":
      return "Maybe";
    default:
      return "Confirm Availability";
  }
}

function defaultDeadlineMs(event: ChoirCalendarEvent) {
  return event.startsAtMs - 24 * 3_600_000;
}

async function assertChoirAvailabilityAccess(user: PublicMember, groupId: string) {
  if (groupId !== SHANAH_WORSHIP_GROUP_ID) return null;
  const group = await getGroupDetail(groupId, user.id);
  if (!group?.isMember && !(await canManageAsAdmin(user))) return null;
  if (group?.isMember && (await isMemberTrainingRequired(user.id, group))) return null;
  return group;
}

export async function canManageChoirAvailability(user: PublicMember, groupId: string) {
  if (groupId !== SHANAH_WORSHIP_GROUP_ID) return false;
  if (await canManageAsAdmin(user)) return true;
  return canManageGroupEvents(user, groupId);
}

async function worshipLeaderUserIds(groupId: string, excludeUserId?: string) {
  const groups = await getGroups();
  const group = groups.find((entry) => entry.id === groupId);
  if (!group) return [];
  return group.memberIds.filter((memberId) => {
    if (excludeUserId && memberId === excludeUserId) return false;
    return isGroupLeaderOrAssistant(group, memberId);
  });
}

function isAssignedToEvent(event: ChoirCalendarEvent) {
  return Boolean(event.personalRoleLabel && event.personalStatus);
}

function detectConflicts(
  event: ChoirCalendarEvent,
  status: ChoirAvailabilityDisplayStatus,
  pendingChange: boolean,
): ChoirAvailabilityConflictKind[] {
  const conflicts: ChoirAvailabilityConflictKind[] = [];
  if (pendingChange) conflicts.push("change_pending");
  if (!isAssignedToEvent(event)) return conflicts;
  if (status === "unavailable") conflicts.push("unavailable_assigned");
  if (status === "maybe") conflicts.push("maybe_assigned");
  return conflicts;
}

function eventsOverlap(a: ChoirCalendarEvent, b: ChoirCalendarEvent) {
  if (a.dateKey !== b.dateKey) return false;
  const windowMs = 2 * 3_600_000;
  return Math.abs(a.startsAtMs - b.startsAtMs) < windowMs && a.id !== b.id;
}

function overlapConflicts(events: ChoirCalendarEvent[], assignedIds: Set<string>) {
  const conflicts = new Set<string>();
  const assigned = events.filter((event) => assignedIds.has(event.id));
  for (const left of assigned) {
    for (const right of events) {
      if (left.id === right.id) continue;
      if (assignedIds.has(right.id) && eventsOverlap(left, right)) {
        conflicts.add(left.id);
        conflicts.add(right.id);
      }
    }
  }
  return conflicts;
}

async function buildOpportunityViews(
  user: PublicMember,
  groupId: string,
  events: ChoirCalendarEvent[],
): Promise<ChoirAvailabilityOpportunityView[]> {
  const memberResponses = await listChoirAvailabilityResponsesForMemberJson(groupId, user.id);
  const responseMap = new Map(memberResponses.map((row) => [row.eventId, row]));
  const deadlines = await getChoirAvailabilityDeadlinesJson();
  const changeRequests = await listChoirScheduleChangeRequestsJson(groupId, user.id);
  const pendingByEvent = new Set(
    changeRequests.filter((row) => row.status === "pending").map((row) => row.eventId),
  );

  const assignedIds = new Set(
    events.filter((event) => isAssignedToEvent(event)).map((event) => event.id),
  );
  const overlapIds = overlapConflicts(events, assignedIds);

  const now = Date.now();
  return events.map((event) => {
    const record = responseMap.get(event.id);
    const status: ChoirAvailabilityDisplayStatus = record?.response ?? "not_responded";
    const deadlineIso = deadlines[event.id] ?? new Date(defaultDeadlineMs(event)).toISOString();
    const deadlineMs = new Date(deadlineIso).getTime();
    const deadlinePassed = now > deadlineMs;
    const conflicts = detectConflicts(event, status, pendingByEvent.has(event.id));
    if (overlapIds.has(event.id)) conflicts.push("overlap");

    return {
      event,
      availabilityStatus: status,
      availabilityLabel: availabilityLabel(status),
      responseDeadline: deadlineIso,
      deadlinePassed,
      canEdit: !deadlinePassed,
      conflicts,
      memberNote: record?.note ?? null,
    };
  });
}

function eligibleFutureEvents(events: ChoirCalendarEvent[], nowMs = Date.now()) {
  return events.filter((event) => event.startsAtMs >= nowMs - 3_600_000);
}

function pastEvents(events: ChoirCalendarEvent[], nowMs = Date.now()) {
  return events.filter((event) => event.startsAtMs < nowMs - 3_600_000);
}

function summarize(opportunities: ChoirAvailabilityOpportunityView[]) {
  let awaiting = 0;
  let available = 0;
  let unavailable = 0;
  let maybe = 0;
  for (const row of opportunities) {
    if (row.availabilityStatus === "not_responded") awaiting += 1;
    if (row.availabilityStatus === "available") available += 1;
    if (row.availabilityStatus === "unavailable") unavailable += 1;
    if (row.availabilityStatus === "maybe") maybe += 1;
  }
  return { awaiting, available, unavailable, maybe };
}

export async function buildChoirAvailabilityHomePayload(
  user: PublicMember,
  groupId: string,
): Promise<ChoirAvailabilityHomePayload | null> {
  const calendar = await buildChoirCalendarPagePayload(user, groupId);
  const team = await buildChoirTeamPagePayload(user, groupId);
  if (!calendar || !team) return null;

  const canManage = await canManageChoirAvailability(user, groupId);
  const future = eligibleFutureEvents(calendar.events);
  const opportunities = await buildOpportunityViews(user, groupId, future);
  const upcomingSlice = opportunities.slice(0, 6);

  const changeRequests = await listChoirScheduleChangeRequestsJson(groupId, user.id);
  const pendingPlanKeys = new Set(
    changeRequests.filter((row) => row.status === "pending").map((row) => row.planKey).filter(Boolean),
  );

  const assignmentPreview = team.upcoming.slice(0, 3).map((assignment) => ({
    ...assignment,
    changeRequestPending: pendingPlanKeys.has(assignment.planKey),
  }));

  return {
    groupId,
    groupChatHref: calendar.groupChatHref,
    canManage,
    teamAvailabilityHref: canManage ? choirAvailabilityTeamHref(groupId) : null,
    opportunities: upcomingSlice,
    assignmentPreview,
    scheduleTabHref: `/groups/${groupId}/availability?tab=my-schedule`,
    teamPageHref: `/groups/${groupId}/team`,
    summary: summarize(opportunities),
  };
}

export async function listChoirAvailabilityOpportunities(
  user: PublicMember,
  groupId: string,
  tab: ChoirAvailabilityTabId,
  filters?: {
    category?: string;
    status?: string;
  },
) {
  const calendar = await buildChoirCalendarPagePayload(user, groupId);
  if (!calendar) return null;

  const now = Date.now();
  let events =
    tab === "past"
      ? pastEvents(calendar.events, now)
      : eligibleFutureEvents(calendar.events, tab === "upcoming" ? now : now);

  if (filters?.category && filters.category !== "all") {
    events = events.filter((event) => event.category === filters.category);
  }

  const views = await buildOpportunityViews(user, groupId, events);

  if (filters?.status && filters.status !== "all") {
    if (filters.status === "awaiting") {
      return views.filter((row) => row.availabilityStatus === "not_responded");
    }
    return views.filter((row) => row.availabilityStatus === filters.status);
  }

  return tab === "past" ? views.reverse() : views;
}

export async function buildChoirAvailabilityCalendarMonth(
  user: PublicMember,
  groupId: string,
  year: number,
  month: number,
) {
  const calendar = await buildChoirCalendarPagePayload(user, groupId);
  if (!calendar) return null;

  const views = await buildOpportunityViews(user, groupId, calendar.events);
  const byDate = new Map<string, ChoirAvailabilityOpportunityView[]>();
  for (const view of views) {
    const list = byDate.get(view.event.dateKey) ?? [];
    list.push(view);
    byDate.set(view.event.dateKey, list);
  }

  const first = new Date(year, month, 1);
  const startPad = first.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const todayKey = new Date().toISOString().slice(0, 10);

  const cells: ChoirAvailabilityCalendarDay[] = [];
  const totalCells = Math.ceil((startPad + daysInMonth) / 7) * 7;

  for (let i = 0; i < totalCells; i += 1) {
    const dayNum = i - startPad + 1;
    const inMonth = dayNum >= 1 && dayNum <= daysInMonth;
    const date = inMonth ? new Date(year, month, dayNum) : new Date(year, month, dayNum);
    const dateKey = inMonth
      ? `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`
      : "";
    const events = inMonth ? byDate.get(dateKey) ?? [] : [];

    let dominantStatus: ChoirAvailabilityCalendarDay["dominantStatus"] = "not_responded";
    if (events.length === 0) {
      dominantStatus = "not_responded";
    } else if (events.length === 1) {
      dominantStatus = events[0].availabilityStatus;
    } else {
      const statuses = new Set(events.map((event) => event.availabilityStatus));
      dominantStatus = statuses.size === 1 ? events[0].availabilityStatus : "mixed";
    }

    cells.push({
      dateKey,
      inMonth,
      isToday: inMonth && dateKey === todayKey,
      events,
      dominantStatus,
    });
  }

  return { year, month, days: cells };
}

export async function getChoirAvailabilitySchedulePayload(user: PublicMember, groupId: string) {
  const team = await buildChoirTeamPagePayload(user, groupId);
  if (!team) return null;
  const changeRequests = await listChoirScheduleChangeRequestsJson(groupId, user.id);
  const pendingPlanKeys = new Set(
    changeRequests.filter((row) => row.status === "pending").map((row) => row.planKey).filter(Boolean),
  );
  return {
    upcoming: team.upcoming.map((assignment) => ({
      ...assignment,
      changeRequestPending: pendingPlanKeys.has(assignment.planKey),
    })),
    recent: team.recent,
  };
}

function isoDaysAgo(days: number) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString().slice(0, 10);
}

export async function buildChoirMySchedulePayload(
  user: PublicMember,
  groupId: string,
): Promise<ChoirMySchedulePayload | null> {
  const schedule = await getChoirAvailabilitySchedulePayload(user, groupId);
  const opportunities = await listChoirAvailabilityOpportunities(user, groupId, "upcoming");
  if (!schedule || !opportunities) return null;

  const nowMs = Date.now();
  const since = isoDaysAgo(30);
  const plans = (await listWorshipPlans({ since }))
    .filter((plan) => plan.status === "published")
    .sort(
      (a, b) =>
        combinePlanDateTime(a.serviceDate, a.serviceTime).getTime() -
        combinePlanDateTime(b.serviceDate, b.serviceTime).getTime(),
    );

  const rehearsals: ChoirMyScheduleRehearsalView[] = [];
  for (const plan of plans) {
    if (!plan.rehearsalDate?.trim()) continue;
    const mine = plan.team.find((member) => member.userId === user.id);
    if (!mine) continue;
    const rehearsalTime = plan.rehearsalTime?.trim() || "19:00";
    const startsAtMs = combinePlanDateTime(plan.rehearsalDate, rehearsalTime).getTime();
    if (startsAtMs < nowMs - 3_600_000) continue;
    const serviceTitle = plan.title?.trim() || "Sunday Service";
    rehearsals.push({
      id: `rehearsal-${plan.serviceDate}-${plan.serviceTime}`,
      title: `Rehearsal — ${serviceTitle}`,
      dateKey: plan.rehearsalDate,
      timeLabel: worshipTimeLabel(rehearsalTime) || rehearsalTime,
      dateTimeLabel: serviceDateTimeLabel(plan.rehearsalDate, rehearsalTime),
      location: site.heroChurchName,
      relatedServiceTitle: serviceTitle,
      startsAtMs,
    });
  }

  const availabilitySubmitted = opportunities.filter((row) => row.availabilityStatus !== "not_responded");
  const availabilityAwaiting = opportunities.filter((row) => row.availabilityStatus === "not_responded");

  return {
    assignments: schedule.upcoming,
    rehearsals,
    availabilitySubmitted,
    availabilityAwaiting,
  };
}

export async function getChoirAvailabilityPreferences(user: PublicMember, groupId: string) {
  if (!(await assertChoirAvailabilityAccess(user, groupId))) return null;
  const stored = await getChoirAvailabilityPreferencesJson(groupId, user.id);
  const team = await buildChoirTeamPagePayload(user, groupId);
  const roleOptions = Array.from(
    new Set((team?.teamMembers ?? []).map((member) => member.roleLabel).filter(Boolean)),
  );
  return {
    preferences: stored,
    roleOptions,
  };
}

export async function getChoirAvailabilityGuidelines(user: PublicMember, groupId: string) {
  if (!(await assertChoirAvailabilityAccess(user, groupId))) return null;
  const stored = await getChoirAvailabilityGuidelinesJson();
  const canManage = await canManageChoirAvailability(user, groupId);
  return { markdown: stored ?? DEFAULT_GUIDELINES, canManage };
}

export async function buildChoirTeamAvailabilityDashboard(user: PublicMember, groupId: string) {
  if (!(await canManageChoirAvailability(user, groupId))) {
    throw new Error("Leadership permission required.");
  }
  const calendar = await buildChoirCalendarPagePayload(user, groupId);
  const team = await buildChoirTeamPagePayload(user, groupId);
  if (!calendar || !team) throw new Error("Unavailable.");

  const future = eligibleFutureEvents(calendar.events).slice(0, 12);
  const allResponses = await listChoirAvailabilityResponsesForGroupJson(groupId);
  const memberIds = team.teamMembers.map((member) => member.userId);
  const pendingChanges = await listChoirScheduleChangeRequestsJson(groupId);

  const events = future.map((event) => {
    const responses = allResponses.filter((row) => row.eventId === event.id);
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
    const notResponded = memberIds.length - responded;
    return {
      event,
      totals: {
        eligible: memberIds.length,
        available,
        unavailable,
        maybe,
        notResponded,
      },
    };
  });

  return {
    events,
    members: team.teamMembers,
    pendingChangeRequests: pendingChanges.filter((row) => row.status === "pending"),
    managePlannerHref: team.managePlannerHref,
  };
}

async function notifyLeadersAvailabilityChange(
  groupId: string,
  user: PublicMember,
  eventTitle: string,
  response: ChoirAvailabilityResponse,
) {
  const leaderIds = await worshipLeaderUserIds(groupId, user.id);
  if (leaderIds.length === 0) return;
  void sendPushToUsers(
    leaderIds,
    {
      title: "Availability updated",
      body: `${user.name} marked ${response} for ${eventTitle}.`,
      url: choirAvailabilityTeamHref(groupId),
    },
    "worship",
  );
}

export async function handleChoirAvailabilityAction(user: PublicMember, body: Record<string, unknown>) {
  const action = String(body.action ?? "");
  const groupId = String(body.groupId ?? SHANAH_WORSHIP_GROUP_ID);

  if (action === "save_response") {
    if (!(await assertChoirAvailabilityAccess(user, groupId))) throw new Error("Access denied.");
    const eventId = String(body.eventId ?? "").trim();
    const response = String(body.response ?? "") as ChoirAvailabilityResponse;
    if (!eventId || !["available", "unavailable", "maybe"].includes(response)) {
      throw new Error("Invalid availability response.");
    }
    const calendar = await buildChoirCalendarPagePayload(user, groupId);
    const event = calendar?.events.find((entry) => entry.id === eventId);
    if (!event) throw new Error("Event not found.");
    if (event.startsAtMs < Date.now() - 3_600_000) {
      throw new Error("Past events cannot be updated.");
    }

    const deadlines = await getChoirAvailabilityDeadlinesJson();
    const deadlineMs = new Date(
      deadlines[eventId] ?? new Date(defaultDeadlineMs(event)).toISOString(),
    ).getTime();
    if (Date.now() > deadlineMs) {
      throw new Error("The availability deadline has passed. Contact worship leadership.");
    }

    const now = new Date().toISOString();
    const existing = await getChoirAvailabilityResponseJson(groupId, eventId, user.id);
    const record = await upsertChoirAvailabilityResponseJson({
      groupId,
      eventId,
      memberId: user.id,
      response,
      note: String(body.note ?? "").trim() || null,
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
    });

    void notifyLeadersAvailabilityChange(groupId, user, event.title, response);
    return { record };
  }

  if (action === "save_bulk") {
    if (!(await assertChoirAvailabilityAccess(user, groupId))) throw new Error("Access denied.");
    const updates = Array.isArray(body.updates) ? body.updates : [];
    const results: { eventId: string; ok: boolean; error?: string }[] = [];
    for (const entry of updates) {
      try {
        await handleChoirAvailabilityAction(user, {
          action: "save_response",
          groupId,
          eventId: String((entry as { eventId?: string }).eventId ?? ""),
          response: String((entry as { response?: string }).response ?? ""),
          note: (entry as { note?: string }).note,
        });
        results.push({ eventId: String((entry as { eventId?: string }).eventId), ok: true });
      } catch (error) {
        results.push({
          eventId: String((entry as { eventId?: string }).eventId ?? ""),
          ok: false,
          error: error instanceof Error ? error.message : "Failed",
        });
      }
    }
    const failed = results.filter((row) => !row.ok);
    if (failed.length > 0 && failed.length === results.length) {
      throw new Error(failed[0]?.error ?? "Could not save availability.");
    }
    return { results, partial: failed.length > 0 };
  }

  if (action === "save_preferences") {
    if (!(await assertChoirAvailabilityAccess(user, groupId))) throw new Error("Access denied.");
    const now = new Date().toISOString();
    const preferences: ChoirAvailabilityPreferences = {
      groupId,
      memberId: user.id,
      preferredServiceTimes: Array.isArray(body.preferredServiceTimes)
        ? body.preferredServiceTimes.map(String)
        : [],
      preferredRoles: Array.isArray(body.preferredRoles) ? body.preferredRoles.map(String) : [],
      generalAvailability:
        body.generalAvailability === "usually_unavailable" ||
        body.generalAvailability === "varies"
          ? body.generalAvailability
          : "usually_available",
      maxFrequency:
        body.maxFrequency === "weekly" ||
        body.maxFrequency === "twice_monthly" ||
        body.maxFrequency === "monthly" ||
        body.maxFrequency === "flexible"
          ? body.maxFrequency
          : null,
      leadershipNotes: String(body.leadershipNotes ?? "").trim() || null,
      updatedAt: now,
    };
    await saveChoirAvailabilityPreferencesJson(preferences);
    return { preferences };
  }

  if (action === "request_change") {
    if (!(await assertChoirAvailabilityAccess(user, groupId))) throw new Error("Access denied.");
    const eventId = String(body.eventId ?? "").trim();
    const reason = String(body.reason ?? "").trim();
    if (!eventId || !reason) throw new Error("Event and reason are required.");

    const calendar = await buildChoirCalendarPagePayload(user, groupId);
    const event = calendar?.events.find((entry) => entry.id === eventId);
    if (!event) throw new Error("Event not found.");

    const team = await buildChoirTeamPagePayload(user, groupId);
    const assignment = team?.upcoming.find(
      (row) => row.planKey && event.worshipPlanKey && row.planKey === event.worshipPlanKey,
    );

    const requestType = String(body.requestType ?? "cannot_serve") as ChoirScheduleChangeRequest["requestType"];
    const record = await createChoirScheduleChangeRequestJson({
      groupId,
      memberId: user.id,
      memberName: user.name,
      eventId,
      planKey: assignment?.planKey ?? event.worshipPlanKey ?? null,
      assignmentRoleLabel: assignment?.roleLabel ?? event.personalRoleLabel ?? null,
      requestType:
        requestType === "request_swap" ||
        requestType === "role_change" ||
        requestType === "time_adjustment"
          ? requestType
          : "cannot_serve",
      reason,
      suggestedReplacement: String(body.suggestedReplacement ?? "").trim() || null,
    });

    const leaderIds = await worshipLeaderUserIds(groupId, user.id);
    void sendPushToUsers(
      leaderIds,
      {
        title: "Schedule change requested",
        body: `${user.name} requested a change for ${event.title}.`,
        url: choirAvailabilityTeamHref(groupId),
      },
      "worship",
    );

    return { request: record };
  }

  if (action === "review_change") {
    if (!(await canManageChoirAvailability(user, groupId))) throw new Error("Leadership permission required.");
    const id = String(body.id ?? "");
    const status = body.status === "approved" ? "approved" : "declined";
    const updated = await updateChoirScheduleChangeRequestJson(id, {
      status,
      reviewedBy: user.id,
      reviewedByName: user.name,
    });
    if (!updated) throw new Error("Request not found.");
    return { request: updated };
  }

  if (action === "save_guidelines") {
    if (!(await canManageChoirAvailability(user, groupId))) throw new Error("Leadership permission required.");
    const markdown = String(body.markdown ?? "").trim();
    if (!markdown) throw new Error("Guidelines cannot be empty.");
    await saveChoirAvailabilityGuidelinesJson(markdown);
    return { ok: true };
  }

  throw new Error("Unknown action.");
}
