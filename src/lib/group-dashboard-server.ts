import type { PublicMember } from "@/lib/auth-types";
import { canManageAsAdmin } from "@/lib/admin-access-server";
import { FRONTLINERS_GROUP_ID } from "@/lib/frontliners-types";
import {
  serviceDateTimeLabel as usherServiceDateTimeLabel,
  usherRoleLabel,
  type UsherSchedule,
} from "@/lib/frontliners-types";
import { canManageFrontLiners } from "@/lib/frontliners-access-server";
import { getGroupDetail, listGroupsForUser } from "@/lib/group-server";
import { isMemberTrainingRequired } from "@/lib/ministry-readiness-server";
import { isMediaGroup } from "@/lib/media-group";
import { isReportableMinistryGroup } from "@/lib/ministry-report-types";
import { getEvents } from "@/lib/event-server";
import {
  groupUsesServiceRoster,
  rosterAssignmentsForUser,
  rosterRoleRows,
  rosterServiceDateTimeLabel,
  type GroupServiceRoster,
} from "@/lib/group-roster-types";
import { canManageGroupRoster } from "@/lib/group-roster-access-server";
import { listGroupServiceRosters } from "@/lib/group-roster-server";
import type { GroupDetail } from "@/lib/group-types";
import type {
  GroupDashboardAssignment,
  GroupDashboardData,
  GroupDashboardNextService,
  GroupDashboardQuickAction,
  GroupDashboardRoleRow,
  GroupScheduleKind,
  GroupsThisSundayAssignment,
  GroupsThisSundayService,
  GroupsThisSundaySummary,
} from "@/lib/group-dashboard-types";
import { listUsherSchedules } from "@/lib/usher-schedule-server";
import { canManageWorshipPlan, isWorshipGroup } from "@/lib/worship-access-server";
import { listWorshipPlans } from "@/lib/worship-server";
import {
  combinePlanDateTime,
  serviceDateTimeLabel,
  worshipPartLabel,
  worshipRoleLabel,
  type WorshipTeamMember,
} from "@/lib/worship-types";

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function shortAssignmentDate(serviceDate: string) {
  return new Date(`${serviceDate}T12:00:00`).toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function compareService(a: { serviceDate: string; serviceTime: string }, b: { serviceDate: string; serviceTime: string }) {
  return combinePlanDateTime(a.serviceDate, a.serviceTime).getTime() -
    combinePlanDateTime(b.serviceDate, b.serviceTime).getTime();
}

function worshipMemberRoleLabel(member: WorshipTeamMember) {
  if (member.partRole?.trim()) {
    return worshipPartLabel(member.partRole);
  }
  return worshipRoleLabel(member.role);
}

function worshipRoleRows(team: WorshipTeamMember[]): GroupDashboardRoleRow[] {
  const buckets = new Map<string, string[]>();
  for (const member of team) {
    const label = worshipMemberRoleLabel(member);
    const names = buckets.get(label) ?? [];
    names.push(member.name);
    buckets.set(label, names);
  }
  return Array.from(buckets.entries()).map(([roleLabel, assignees]) => ({
    roleLabel,
    assignees,
  }));
}

function usherRoleRows(schedule: UsherSchedule): GroupDashboardRoleRow[] {
  const buckets = new Map<string, string[]>();
  for (const usher of schedule.ushers) {
    const label = usherRoleLabel(usher.role);
    const names = buckets.get(label) ?? [];
    names.push(usher.name);
    buckets.set(label, names);
  }
  return Array.from(buckets.entries()).map(([roleLabel, assignees]) => ({
    roleLabel,
    assignees,
  }));
}

export function resolveGroupScheduleKind(group: { id: string; name: string; category: GroupDetail["category"] }): GroupScheduleKind {
  if (isWorshipGroup(group) || group.id === "group-choir") return "worship";
  if (group.id === FRONTLINERS_GROUP_ID) return "frontliners";
  if (groupUsesServiceRoster(group)) return "roster";
  return "generic";
}

function baseQuickActions(
  group: GroupDetail,
  options: {
    isLeader: boolean;
    showReport: boolean;
    showCalendar: boolean;
    showWorship: boolean;
    showFrontLiners: boolean;
    showRoster: boolean;
  },
): GroupDashboardQuickAction[] {
  const actions: GroupDashboardQuickAction[] = [
    { id: "chat", label: "Open chat", action: "chat" },
  ];

  if (options.showCalendar) {
    actions.push({ id: "calendar", label: "View events", action: "calendar" });
  }
  if (options.showWorship) {
    actions.push({ id: "worship", label: "Worship planner", href: "/worship" });
  }
  if (options.showFrontLiners) {
    actions.push({ id: "frontliners", label: "FrontLiners hub", href: "/frontliners" });
  }
  if (options.showRoster && options.isLeader) {
    actions.push({ id: "roster", label: "Manage roster", action: "roster" });
  }
  if (isMediaGroup(group)) {
    actions.push({ id: "live", label: "Live & streams", href: "/live" });
    actions.push({ id: "photos", label: "Upload media", href: "/photos/upload" });
  }
  if (options.isLeader) {
    actions.push({ id: "invite", label: "Invite member", action: "invite" });
  }
  if (options.showReport && options.isLeader) {
    actions.push({ id: "report", label: "Submit report", action: "report" });
  }

  return actions;
}

async function buildWorshipDashboard(
  user: PublicMember,
  canManage: boolean,
): Promise<Pick<GroupDashboardData, "nextService" | "myAssignments">> {
  const since = todayIso();
  const plans = (await listWorshipPlans({ since }))
    .filter((plan) => plan.status === "published" || canManage)
    .sort(compareService);

  const published = plans.filter((plan) => plan.status === "published");
  const nextPlan = published[0] ?? null;

  let nextService: GroupDashboardNextService | null = null;
  if (nextPlan) {
    nextService = {
      title: nextPlan.title?.trim() || "Sunday Service",
      subtitle: serviceDateTimeLabel(nextPlan.serviceDate, nextPlan.serviceTime),
      roles: worshipRoleRows(nextPlan.team),
      href: `/worship?date=${encodeURIComponent(nextPlan.serviceDate)}&time=${encodeURIComponent(nextPlan.serviceTime)}`,
    };
  } else {
    nextService = {
      title: "Sunday Service",
      subtitle: "No published worship roster yet",
      roles: [],
      href: canManage ? "/worship" : undefined,
      emptyMessage: canManage
        ? "Publish the next service plan so your team can see who is serving."
        : "Your worship leader has not published the next service roster yet.",
    };
  }

  const myAssignments: GroupDashboardAssignment[] = published
    .filter((plan) => plan.team.some((member) => member.userId === user.id))
    .slice(0, 6)
    .map((plan) => {
      const mine = plan.team.find((member) => member.userId === user.id);
      return {
        id: `${plan.serviceDate}-${plan.serviceTime}`,
        leftLabel: `${shortAssignmentDate(plan.serviceDate)} · ${mine ? worshipMemberRoleLabel(mine) : "Team"}`,
        rightLabel: plan.title?.trim() || "Sunday Service",
        href: `/worship?date=${encodeURIComponent(plan.serviceDate)}&time=${encodeURIComponent(plan.serviceTime)}`,
      };
    });

  return { nextService, myAssignments };
}

async function buildFrontLinersDashboard(
  user: PublicMember,
  canManage: boolean,
): Promise<Pick<GroupDashboardData, "nextService" | "myAssignments">> {
  const since = todayIso();
  const schedules = (await listUsherSchedules({ since }))
    .filter((schedule) => schedule.status === "published" || canManage)
    .sort(compareService);

  const published = schedules.filter((schedule) => schedule.status === "published");
  const nextSchedule = published[0] ?? null;

  let nextService: GroupDashboardNextService | null = null;
  if (nextSchedule) {
    nextService = {
      title: "Sunday Service",
      subtitle: usherServiceDateTimeLabel(nextSchedule.serviceDate, nextSchedule.serviceTime),
      roles: usherRoleRows(nextSchedule),
      href: `/frontliners?date=${encodeURIComponent(nextSchedule.serviceDate)}&time=${encodeURIComponent(nextSchedule.serviceTime)}`,
    };
  } else {
    nextService = {
      title: "Sunday Service",
      subtitle: "No published usher roster yet",
      roles: [],
      href: canManage ? "/frontliners" : undefined,
      emptyMessage: canManage
        ? "Publish the usher schedule so volunteers know where they are serving."
        : "Your FrontLiners leader has not published the next service roster yet.",
    };
  }

  const myAssignments: GroupDashboardAssignment[] = published
    .filter((schedule) => schedule.ushers.some((usher) => usher.userId === user.id))
    .slice(0, 6)
    .map((schedule) => {
      const mine = schedule.ushers.find((usher) => usher.userId === user.id);
      return {
        id: `${schedule.serviceDate}-${schedule.serviceTime}`,
        leftLabel: `${shortAssignmentDate(schedule.serviceDate)} · ${mine ? usherRoleLabel(mine.role) : "Team"}`,
        rightLabel: "Sunday Service",
        href: `/frontliners?date=${encodeURIComponent(schedule.serviceDate)}&time=${encodeURIComponent(schedule.serviceTime)}`,
      };
    });

  return { nextService, myAssignments };
}

async function buildGroupRosterDashboard(
  user: PublicMember,
  group: GroupDetail,
  canManage: boolean,
): Promise<Pick<GroupDashboardData, "nextService" | "myAssignments">> {
  const since = todayIso();
  const rosters = (await listGroupServiceRosters({ groupId: group.id, since }))
    .filter((roster) => roster.status === "published" || canManage)
    .sort(compareService);

  const published = rosters.filter((roster) => roster.status === "published");
  const nextRoster = published[0] ?? null;

  const rosterHref = (roster: Pick<GroupServiceRoster, "serviceDate" | "serviceTime">) =>
    `/groups/${group.id}?rosterDate=${encodeURIComponent(roster.serviceDate)}&rosterTime=${encodeURIComponent(roster.serviceTime)}`;

  let nextService: GroupDashboardNextService | null = null;
  if (nextRoster) {
    nextService = {
      title: nextRoster.title?.trim() || "Sunday Service",
      subtitle: rosterServiceDateTimeLabel(nextRoster.serviceDate, nextRoster.serviceTime),
      roles: rosterRoleRows(nextRoster.assignments),
      href: rosterHref(nextRoster),
    };
  } else {
    nextService = {
      title: "Sunday Service",
      subtitle: "No published service roster yet",
      roles: [],
      emptyMessage: canManage
        ? "Publish a service roster so your team can see who is serving in each role."
        : "Your leader has not published the next service roster yet. Check back after Sunday planning.",
    };
  }

  const myAssignments: GroupDashboardAssignment[] = published
    .flatMap((roster) => {
      const mine = rosterAssignmentsForUser(roster.assignments, user.id);
      return mine.map((slot) => ({
        id: `${roster.serviceDate}-${roster.serviceTime}-${slot.roleLabel}`,
        leftLabel: `${shortAssignmentDate(roster.serviceDate)} · ${slot.roleLabel}`,
        rightLabel: roster.title?.trim() || "Sunday Service",
        href: rosterHref(roster),
      }));
    })
    .slice(0, 6);

  return { nextService, myAssignments };
}

async function buildGenericDashboard(
  group: GroupDetail,
): Promise<Pick<GroupDashboardData, "nextService" | "myAssignments">> {
  const events = await getEvents({ groupId: group.id });
  const today = todayIso();
  const upcoming = events
    .filter((event) => !event.date || event.date >= today)
    .sort((a, b) => String(a.date).localeCompare(String(b.date)))[0];

  if (!upcoming) {
    return {
      nextService: group.meetingSchedule
        ? {
            title: group.name,
            subtitle: group.meetingSchedule,
            roles: [],
          }
        : null,
      myAssignments: [],
    };
  }

  return {
    nextService: {
      title: upcoming.title,
      subtitle: upcoming.date
        ? new Date(`${upcoming.date}T12:00:00`).toLocaleDateString(undefined, {
            weekday: "long",
            month: "short",
            day: "numeric",
          })
        : "Upcoming event",
      roles: [],
      href: `/groups/${group.id}?calendar=1`,
    },
    myAssignments: [],
  };
}

export async function buildGroupDashboard(
  user: PublicMember,
  groupId: string,
): Promise<GroupDashboardData | null> {
  const group = await getGroupDetail(groupId, user.id);
  if (!group) {
    return null;
  }

  const isSiteAdmin = await canManageAsAdmin(user);
  if (!group.isMember && !isSiteAdmin) {
    return null;
  }

  if (group.isMember && (await isMemberTrainingRequired(user.id, group))) {
    return null;
  }

  const scheduleKind = resolveGroupScheduleKind(group);
  const isLeader = group.isAdmin || group.isAssistantLeader;
  const showReport = isReportableMinistryGroup({
    id: group.id,
    name: group.name,
    category: group.category,
  });
  const showCalendar = group.isMember;
  const showWorship = scheduleKind === "worship";
  const showFrontLiners = scheduleKind === "frontliners";
  const showRoster = scheduleKind === "roster";

  const quickActions = baseQuickActions(group, {
    isLeader,
    showReport,
    showCalendar,
    showWorship,
    showFrontLiners,
    showRoster,
  });

  const usesServiceRoster = groupUsesServiceRoster(group);
  const canManageRoster = usesServiceRoster ? await canManageGroupRoster(user, groupId) : false;

  if (scheduleKind === "worship") {
    const canManage = await canManageWorshipPlan(user);
    const worship = await buildWorshipDashboard(user, canManage);
    return { scheduleKind, quickActions, usesServiceRoster, canManageRoster, ...worship };
  }

  if (scheduleKind === "frontliners") {
    const canManage = await canManageFrontLiners(user);
    const frontliners = await buildFrontLinersDashboard(user, canManage);
    return { scheduleKind, quickActions, usesServiceRoster, canManageRoster, ...frontliners };
  }

  if (scheduleKind === "roster") {
    const roster = await buildGroupRosterDashboard(user, group, canManageRoster);
    return { scheduleKind, quickActions, usesServiceRoster, canManageRoster, ...roster };
  }

  const generic = await buildGenericDashboard(group);
  return { scheduleKind, quickActions, usesServiceRoster, canManageRoster, ...generic };
}

export async function buildGroupsThisSunday(user: PublicMember): Promise<GroupsThisSundaySummary> {
  const groups = (await listGroupsForUser(user.id, { mine: true })).filter((group) => group.isMember);
  const assignments: GroupsThisSundayAssignment[] = [];
  const teamServices: GroupsThisSundayService[] = [];

  for (const group of groups) {
    const dashboard = await buildGroupDashboard(user, group.id);
    if (!dashboard) continue;

    for (const assignment of dashboard.myAssignments) {
      assignments.push({
        groupId: group.id,
        groupName: group.name,
        leftLabel: assignment.leftLabel,
        rightLabel: assignment.rightLabel,
        href: assignment.href ?? `/groups/${group.id}`,
      });
    }

    if (
      dashboard.myAssignments.length === 0 &&
      dashboard.nextService &&
      (dashboard.nextService.roles.length > 0 || dashboard.nextService.subtitle)
    ) {
      teamServices.push({
        groupId: group.id,
        groupName: group.name,
        title: dashboard.nextService.title,
        subtitle: dashboard.nextService.subtitle,
        href: dashboard.nextService.href ?? `/groups/${group.id}`,
      });
    }
  }

  return {
    assignments: assignments.slice(0, 8),
    teamServices: teamServices.slice(0, 4),
  };
}
