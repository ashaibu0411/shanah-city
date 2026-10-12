import type { PublicMember } from "@/lib/auth-types";
import { canManageAsAdmin } from "@/lib/admin-access-server";
import { getGroupDetail } from "@/lib/group-server";
import { isMemberTrainingRequired } from "@/lib/ministry-readiness-server";
import { listGroupServiceSchedules } from "@/lib/choir-service-schedule-server";
import {
  getGroupServiceScheduleConfig,
  programLabel,
} from "@/lib/group-service-schedule-config";
import { listChoirAnnouncementFeed } from "@/lib/choir-announcements-server";
import { canManageGroupEvents } from "@/lib/group-permissions-server";
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
import { getChoirPreparation } from "@/lib/stores/choir-preparation-json";
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

function pickRehearsalFromPlans(
  plans: WorshipServicePlan[],
  now: Date,
): ChoirRehearsalView | null {
  const candidates = plans
    .filter((plan) => plan.rehearsalDate && plan.status === "published")
    .map((plan) => ({
      plan,
      when: combinePlanDateTime(plan.rehearsalDate!, plan.rehearsalTime || "19:00"),
    }))
    .filter((entry) => entry.when.getTime() >= now.getTime() - 3_600_000)
    .sort((a, b) => a.when.getTime() - b.when.getTime());

  const next = candidates[0];
  if (!next) return null;

  const date = new Date(`${next.plan.rehearsalDate!}T12:00:00`);
  return {
    id: `plan-rehearsal-${next.plan.serviceDate}-${next.plan.serviceTime}`,
    title: `Rehearsal for ${next.plan.title?.trim() || "Sunday Service"}`,
    dateLabel: date.toLocaleDateString(undefined, {
      weekday: "long",
      month: "short",
      day: "numeric",
    }),
    timeLabel: next.plan.rehearsalTime ? worshipTimeLabel(next.plan.rehearsalTime) : "Time TBD",
    location: site.heroChurchName,
    notes: next.plan.rehearsalNotes?.trim() || undefined,
    source: "worship-plan",
    calendarHref: `/groups/${SHANAH_WORSHIP_GROUP_ID}?calendar=1`,
  };
}

async function pickRehearsalFromSchedule(groupId: string, now: Date): Promise<ChoirRehearsalView | null> {
  const entries = await listGroupServiceSchedules(groupId);
  const upcoming = entries
    .map((entry) => ({
      entry,
      when: combinePlanDateTime(entry.serviceDate, entry.serviceTime),
    }))
    .filter((row) => row.when.getTime() >= now.getTime() - 3_600_000)
    .sort((a, b) => a.when.getTime() - b.when.getTime());

  const next = upcoming[0];
  if (!next) return null;

  const scheduleConfig = getGroupServiceScheduleConfig(groupId);
  const date = new Date(`${next.entry.serviceDate}T12:00:00`);
  return {
    id: `schedule-${next.entry.id}`,
    title: scheduleConfig
      ? programLabel(scheduleConfig, next.entry.program)
      : next.entry.program,
    dateLabel: date.toLocaleDateString(undefined, {
      weekday: "long",
      month: "short",
      day: "numeric",
    }),
    timeLabel: worshipTimeLabel(next.entry.serviceTime),
    location: site.heroChurchName,
    notes: next.entry.notes?.trim() || undefined,
    source: "service-schedule",
    calendarHref: `/groups/${SHANAH_WORSHIP_GROUP_ID}?calendar=1&event=${encodeURIComponent(`group-schedule-${groupId}-${next.entry.id}`)}`,
  };
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
  let rehearsal = pickRehearsalFromPlans(publishedPlans, now);
  if (!rehearsal) {
    rehearsal = await pickRehearsalFromSchedule(groupId, now);
  }

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
  const preparationChecked = preparationPlanKey
    ? await getChoirPreparation(user.id, preparationPlanKey)
    : [];

  const rehearsalRoomHref =
    assignment?.worshipHref ?? upcomingServicePreview?.worshipHref ?? (canManage ? "/worship" : null);

  return {
    assignment,
    upcomingServicePreview,
    rehearsal,
    announcements,
    preparationPlanKey,
    preparationChecked,
    canManageSchedule,
    canManageWorship: canManage,
    rehearsalRoomHref,
  };
}
