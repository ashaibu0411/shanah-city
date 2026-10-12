import type { PublicMember } from "@/lib/auth-types";
import { canManageAsAdmin } from "@/lib/admin-access-server";
import { getGroupDetail } from "@/lib/group-server";
import { isMemberTrainingRequired } from "@/lib/ministry-readiness-server";
import type { ChoirRehearsalView } from "@/lib/choir-dashboard-types";
import type { ChoirSetlistServiceSummary } from "@/lib/choir-setlist-types";
import type { ChoirRehearsalPagePayload } from "@/lib/choir-rehearsal-types";
import {
  SHANAH_WORSHIP_GROUP_ID,
  choirPlanKey,
} from "@/lib/choir-group-constants";
import { listGroupServiceSchedules } from "@/lib/choir-service-schedule-server";
import {
  getGroupServiceScheduleConfig,
  programLabel,
} from "@/lib/group-service-schedule-config";
import { listWorshipPlans } from "@/lib/worship-server";
import {
  canManageWorshipPlan,
  canViewWorshipServicePlan,
} from "@/lib/worship-access-server";
import {
  combinePlanDateTime,
  serviceDateTimeLabel,
  worshipPartLabel,
  worshipRoleLabel,
  worshipTimeLabel,
  type WorshipServicePlan,
  type WorshipTeamMember,
} from "@/lib/worship-types";
import { site } from "@/lib/site";

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function comparePlan(a: WorshipServicePlan, b: WorshipServicePlan) {
  return (
    combinePlanDateTime(a.serviceDate, a.serviceTime).getTime() -
    combinePlanDateTime(b.serviceDate, b.serviceTime).getTime()
  );
}

function toServiceSummary(plan: WorshipServicePlan): ChoirSetlistServiceSummary {
  return {
    planKey: choirPlanKey(plan.serviceDate, plan.serviceTime),
    serviceDate: plan.serviceDate,
    serviceTime: plan.serviceTime,
    title: plan.title?.trim() || "Sunday Service",
    dateTimeLabel: serviceDateTimeLabel(plan.serviceDate, plan.serviceTime),
    songCount: plan.songs.length,
    status: plan.status,
  };
}

function memberRoleLabel(member: WorshipTeamMember) {
  const base = worshipRoleLabel(member.role);
  if (member.partRole?.trim()) {
    const part = worshipPartLabel(member.partRole);
    if (member.role === "singer") {
      return `${part} vocals`;
    }
    return `${base} (${part})`;
  }
  return base;
}

function pickRehearsalFromPlans(plans: WorshipServicePlan[], now: Date): ChoirRehearsalView | null {
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
    calendarHref: `/groups/${SHANAH_WORSHIP_GROUP_ID}/calendar`,
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
    calendarHref: `/groups/${SHANAH_WORSHIP_GROUP_ID}/calendar`,
  };
}

export async function buildChoirRehearsalPagePayload(
  user: PublicMember,
  groupId: string,
  selectedPlanKey?: string,
): Promise<ChoirRehearsalPagePayload | null> {
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
  const since = todayIso();
  const plans = (await listWorshipPlans({ since }))
    .filter((plan) => canViewWorshipServicePlan(canManage, plan))
    .sort(comparePlan);

  const key = selectedPlanKey?.trim();
  const selected =
    (key ? plans.find((plan) => choirPlanKey(plan.serviceDate, plan.serviceTime) === key) : null) ??
    plans.find((plan) => plan.status === "published") ??
    plans[0] ??
    null;

  const mine = selected?.team.find((member) => member.userId === user.id);

  const now = new Date();
  let rehearsal = pickRehearsalFromPlans(
    plans.filter((plan) => plan.status === "published"),
    now,
  );
  if (!rehearsal) {
    rehearsal = await pickRehearsalFromSchedule(groupId, now);
  }

  return {
    services: plans.map(toServiceSummary),
    canManage,
    groupChatHref: `/groups/${SHANAH_WORSHIP_GROUP_ID}?chat=1`,
    memberRoleLabel: mine ? memberRoleLabel(mine) : null,
    memberPartRole: mine?.partRole?.trim() || null,
    rehearsal,
  };
}
