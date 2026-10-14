import type { PublicMember } from "@/lib/auth-types";
import { canManageAsAdmin } from "@/lib/admin-access-server";
import { getGroupDetail } from "@/lib/group-server";
import { isMemberTrainingRequired } from "@/lib/ministry-readiness-server";
import { listChoirAnnouncementFeed, listStoredChoirAnnouncementFeed } from "@/lib/choir-announcements-server";
import { choirConnectHref } from "@/lib/choir-connect-links";
import { getGroupChatInboxForUser } from "@/lib/group-chat-server";
import { memberHasFullGroupAccess } from "@/lib/ministry-readiness-server";
import { canManageGroupEvents } from "@/lib/group-permissions-server";
import { choirCalendarRehearsalsHref } from "@/lib/choir-calendar-links";
import {
  SHANAH_WORSHIP_GROUP_ID,
  choirPlanKey,
} from "@/lib/choir-group-constants";
import type {
  ChoirAnnouncementView,
  ChoirAssignmentView,
  ChoirHomeDashboard,
  ChoirRehearsalView,
} from "@/lib/choir-dashboard-types";
import { getChoirPreparation } from "@/lib/choir-preparation-server";
import { nextDefaultChoirRehearsal } from "@/lib/choir-default-rehearsal";
import { getEvents } from "@/lib/event-server";
import { site } from "@/lib/site";
import { listWorshipPlans } from "@/lib/worship-server";
import { canManageWorshipPlan } from "@/lib/worship-access-server";
import {
  combinePlanDateTime,
  serviceDateTimeLabel,
  worshipPartLabel,
  worshipRoleLabel,
  worshipTimeLabel,
  type WorshipServicePlan,
  type WorshipTeamMember,
} from "@/lib/worship-types";

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function comparePlan(a: WorshipServicePlan, b: WorshipServicePlan) {
  return (
    combinePlanDateTime(a.serviceDate, a.serviceTime).getTime() -
    combinePlanDateTime(b.serviceDate, b.serviceTime).getTime()
  );
}

function worshipHref(plan: Pick<WorshipServicePlan, "serviceDate" | "serviceTime">) {
  return `/worship?date=${encodeURIComponent(plan.serviceDate)}&time=${encodeURIComponent(plan.serviceTime)}`;
}

function memberRoleLabel(member: WorshipTeamMember) {
  const base = worshipRoleLabel(member.role);
  if (member.partRole?.trim()) {
    const part = worshipPartLabel(member.partRole);
    if (member.role === "singer") {
      return `Vocals (${part})`;
    }
    return `${base} (${part})`;
  }
  return base;
}

function planToAssignmentView(
  plan: WorshipServicePlan,
  userId: string,
  isPersonal: boolean,
): ChoirAssignmentView {
  const mine = plan.team.find((member) => member.userId === userId);
  return {
    planKey: choirPlanKey(plan.serviceDate, plan.serviceTime),
    serviceDate: plan.serviceDate,
    serviceTime: plan.serviceTime,
    title: plan.title?.trim() || "Sunday Service",
    dateTimeLabel: serviceDateTimeLabel(plan.serviceDate, plan.serviceTime),
    location: site.heroChurchName,
    roleLabel: isPersonal && mine ? memberRoleLabel(mine) : null,
    songCount: plan.songs.length,
    worshipHref: worshipHref(plan),
    isPersonal,
  };
}

function isLeaderRehearsalEvent(title: string) {
  return title.toLowerCase().includes("rehearsal");
}

function eventTimeToPlanTime(time: string | undefined) {
  const raw = time?.trim() ?? "";
  const match = raw.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!match) return raw || "18:00";
  let hour = Number.parseInt(match[1], 10);
  const minute = match[2];
  const meridiem = match[3].toUpperCase();
  if (meridiem === "PM" && hour < 12) hour += 12;
  if (meridiem === "AM" && hour === 12) hour = 0;
  return `${String(hour).padStart(2, "0")}:${minute}`;
}

async function pickLeaderScheduledRehearsals(
  groupId: string,
  now: Date,
): Promise<Array<{ when: number; view: ChoirRehearsalView }>> {
  const events = await getEvents({ groupId });
  const results: Array<{ when: number; view: ChoirRehearsalView }> = [];

  for (const event of events) {
    const dateKey = event.startsOn?.trim();
    if (!dateKey || !isLeaderRehearsalEvent(event.title ?? "")) continue;

    const planTime = eventTimeToPlanTime(event.time);
    const when = combinePlanDateTime(dateKey, planTime).getTime();
    if (when < now.getTime() - 3_600_000) continue;

    const date = new Date(`${dateKey}T12:00:00`);
    results.push({
      when,
      view: {
        id: `group-event-rehearsal-${event.id}`,
        title: event.title.trim() || "Worship rehearsal",
        dateLabel: date.toLocaleDateString(undefined, {
          weekday: "long",
          month: "short",
          day: "numeric",
        }),
        timeLabel: event.time?.trim() || "Time TBD",
        location: event.location?.trim() || site.heroChurchName,
        notes: event.rsvpInstructions?.trim() || undefined,
        source: "group-event",
        calendarHref: choirCalendarRehearsalsHref(SHANAH_WORSHIP_GROUP_ID),
      },
    });
  }

  return results;
}

function pickPlanScheduledRehearsals(
  plans: WorshipServicePlan[],
  now: Date,
): Array<{ when: number; view: ChoirRehearsalView }> {
  return plans
    .filter((plan) => plan.rehearsalDate && plan.status === "published")
    .map((plan) => ({
      plan,
      when: combinePlanDateTime(plan.rehearsalDate!, plan.rehearsalTime || "19:00").getTime(),
    }))
    .filter((entry) => entry.when >= now.getTime() - 3_600_000)
    .map(({ plan, when }) => {
      const date = new Date(`${plan.rehearsalDate!}T12:00:00`);
      return {
        when,
        view: {
          id: `plan-rehearsal-${plan.serviceDate}-${plan.serviceTime}`,
          title: `Rehearsal for ${plan.title?.trim() || "Sunday Service"}`,
          dateLabel: date.toLocaleDateString(undefined, {
            weekday: "long",
            month: "short",
            day: "numeric",
          }),
          timeLabel: plan.rehearsalTime ? worshipTimeLabel(plan.rehearsalTime) : "Time TBD",
          location: site.heroChurchName,
          notes: plan.rehearsalNotes?.trim() || undefined,
          source: "worship-plan" as const,
          calendarHref: choirCalendarRehearsalsHref(SHANAH_WORSHIP_GROUP_ID),
        },
      };
    });
}

async function resolveUpcomingRehearsal(
  groupId: string,
  plans: WorshipServicePlan[],
  now: Date,
): Promise<ChoirRehearsalView> {
  const leaderEvents = await pickLeaderScheduledRehearsals(groupId, now);
  const planRehearsals = pickPlanScheduledRehearsals(plans, now);
  const candidates = [...planRehearsals, ...leaderEvents].sort((a, b) => a.when - b.when);
  if (candidates[0]) return candidates[0].view;
  return nextDefaultChoirRehearsal(now);
}

export async function buildChoirHomeDashboard(
  user: PublicMember,
  groupId: string,
): Promise<ChoirHomeDashboard | null> {
  if (groupId !== SHANAH_WORSHIP_GROUP_ID) {
    return null;
  }

  const group = await getGroupDetail(groupId, user.id);
  const isSiteAdmin = await canManageAsAdmin(user);
  if (!group?.isMember && !isSiteAdmin) {
    return null;
  }

  if (group?.isMember && (await isMemberTrainingRequired(user.id, group))) {
    return null;
  }

  const canManage = await canManageWorshipPlan(user);
  const canManageSchedule = await canManageGroupEvents(user, groupId);
  const since = todayIso();

  const publishedPlans = (await listWorshipPlans({ since }))
    .filter((plan) => plan.status === "published")
    .sort(comparePlan);

  const nextPublished = publishedPlans[0] ?? null;
  const personalPlans = publishedPlans.filter((plan) =>
    plan.team.some((member) => member.userId === user.id),
  );
  const nextPersonal = personalPlans[0] ?? null;

  let assignment: ChoirAssignmentView | null = null;
  let upcomingServicePreview: ChoirAssignmentView | null = null;

  if (nextPersonal) {
    assignment = planToAssignmentView(nextPersonal, user.id, true);
  } else if (nextPublished) {
    upcomingServicePreview = planToAssignmentView(nextPublished, user.id, false);
  }

  const now = new Date();
  const rehearsal = await resolveUpcomingRehearsal(groupId, publishedPlans, now);

  const feed = await listChoirAnnouncementFeed(groupId, 3);
  const announcements: ChoirAnnouncementView[] = feed.map((item) => ({
    id: item.id,
    title: item.title,
    authorName: item.authorName,
    excerpt: item.excerpt,
    createdAt: item.createdAt,
    detailHref: item.detailHref,
    isSample: item.isSample,
  }));

  const preparationPlanKey =
    assignment?.planKey ?? upcomingServicePreview?.planKey ?? null;
  let preparationChecked: string[] = [];
  if (preparationPlanKey) {
    try {
      preparationChecked = await getChoirPreparation(user.id, preparationPlanKey);
    } catch (error) {
      console.error("[choir-home] preparation load failed", error);
      preparationChecked = [];
    }
  }

  const rehearsalRoomHref = (() => {
    const target = assignment ?? upcomingServicePreview;
    if (target) {
      const params = new URLSearchParams({
        date: target.serviceDate,
        time: String(target.serviceTime),
      });
      return `/groups/${SHANAH_WORSHIP_GROUP_ID}/rehearsal?${params.toString()}`;
    }
    return `/groups/${SHANAH_WORSHIP_GROUP_ID}/rehearsal`;
  })();

  const chatAccess = group ? await memberHasFullGroupAccess(user.id, groupId) : { allowed: false as const };
  const canAccessTeamChat = chatAccess.allowed;

  const teamConnectChatHref = choirConnectHref(groupId, "chat");

  let chatUnreadCount = 0;
  if (canAccessTeamChat) {
    const inbox = await getGroupChatInboxForUser(user.id);
    chatUnreadCount = inbox.find((row) => row.groupId === groupId)?.unreadCount ?? 0;
  }

  const storedAnnouncements = await listStoredChoirAnnouncementFeed(groupId);
  const pinnedRow = storedAnnouncements.find((row) => row.pinned && !row.isSample);
  const pinnedLeadershipAnnouncement = pinnedRow
    ? {
        id: pinnedRow.id,
        title: pinnedRow.title,
        excerpt: pinnedRow.excerpt,
        authorName: pinnedRow.authorName,
        createdAt: pinnedRow.createdAt,
        detailHref: `${choirConnectHref(groupId, "announcements")}#announcement-${encodeURIComponent(pinnedRow.id)}`,
      }
    : null;

  const chatContext =
    group && canAccessTeamChat
      ? {
          groupId: group.id,
          groupName: group.name,
          groupCategory: group.category,
          groupIconUrl: group.iconUrl,
          groupUpdatedAt: group.updatedAt,
          userId: user.id,
          memberCount: group.members.length,
          participants: group.members.map((member) => ({
            id: member.id,
            name: member.name,
            isLeader: member.isAdmin || member.isAssistantLeader,
            subtitle: member.isAdmin
              ? "Leader"
              : member.isAssistantLeader
                ? "Assistant leader"
                : undefined,
          })),
        }
      : null;

  const announcementsWithoutPinnedDuplicate = pinnedLeadershipAnnouncement
    ? announcements.filter((item) => item.id !== pinnedLeadershipAnnouncement.id)
    : announcements;

  return {
    assignment,
    upcomingServicePreview,
    rehearsal,
    announcements: announcementsWithoutPinnedDuplicate,
    pinnedLeadershipAnnouncement,
    chatContext,
    teamConnectChatHref,
    chatUnreadCount,
    canAccessTeamChat,
    preparationPlanKey,
    preparationChecked,
    canManageSchedule,
    canManageWorship: canManage,
    rehearsalRoomHref,
  };
}
