import { getConfiguredWorshipGroupId } from "@/lib/worship-access-server";
import {
  combinePlanDateTime,
  serviceDateTimeLabel,
  type WorshipServicePlan,
} from "@/lib/worship-types";
import {
  listWorshipPlans,
  markRehearsalReminderSent,
  markUploadDutyReminderSent,
} from "@/lib/worship-server";
import { getWorshipRotationConfig } from "@/lib/worship-rotation-server";
import {
  notifyWorshipPlanPublished,
  notifyWorshipRehearsalReminder,
  notifyWorshipUploadDutyReminder,
} from "@/lib/push-server";

export async function processWorshipRehearsalReminders(reference = new Date()) {
  const plans = await listWorshipPlans({ status: "published" });
  const due = plans.filter((plan) => {
    if (!plan.rehearsalDate || plan.reminderSentAt) return false;
    const rehearsalAt = combinePlanDateTime(plan.rehearsalDate, plan.rehearsalTime || "19:00");
    const hoursUntil = (rehearsalAt.getTime() - reference.getTime()) / (1000 * 60 * 60);
    return hoursUntil > 0 && hoursUntil <= 24;
  });

  let sent = 0;
  for (const plan of due) {
    const result = await notifyWorshipRehearsalReminder(plan);
    if (result.sent > 0) {
      await markRehearsalReminderSent(plan.serviceDate, plan.serviceTime);
      sent += 1;
    }
  }

  return { checked: plans.length, remindersSent: sent };
}

export async function processWorshipUploadDutyReminders(reference = new Date()) {
  const [plans, config] = await Promise.all([
    listWorshipPlans(),
    getWorshipRotationConfig(),
  ]);

  const leadDays = config.uploadDutyLeadDays || 4;
  let sent = 0;

  for (const plan of plans) {
    if (!plan.uploadDutyUserId || plan.uploadDutyReminderSentAt) continue;

    const serviceAt = combinePlanDateTime(plan.serviceDate, plan.serviceTime || "10:00");
    const daysUntil =
      (serviceAt.getTime() - reference.getTime()) / (1000 * 60 * 60 * 24);

    if (daysUntil <= 0 || daysUntil > leadDays + 1) continue;

    const result = await notifyWorshipUploadDutyReminder({
      userId: plan.uploadDutyUserId,
      serviceDate: plan.serviceDate,
      serviceTime: plan.serviceTime,
      title: plan.title || serviceDateTimeLabel(plan.serviceDate, plan.serviceTime),
    });

    if (result.sent > 0) {
      await markUploadDutyReminderSent(plan.serviceDate, plan.serviceTime);
      sent += 1;
    }
  }

  return { checked: plans.length, uploadDutyRemindersSent: sent };
}

export async function publishWorshipPlanNotifications(plan: WorshipServicePlan) {
  return notifyWorshipPlanPublished({
    teamUserIds: plan.team.map((member) => member.userId),
    title: plan.title || serviceDateTimeLabel(plan.serviceDate, plan.serviceTime),
    serviceDate: plan.serviceDate,
    serviceTime: plan.serviceTime,
  });
}

export async function publishWorshipRotationScheduleNotifications(input: {
  assignments: Awaited<ReturnType<typeof import("@/lib/worship-rotation-server").listUpcomingLeaderAssignments>>;
}) {
  const { getConfiguredWorshipGroupId } = await import("@/lib/worship-access-server");
  const {
    notifyWorshipRotationLeaderAssignments,
    notifyWorshipRotationSchedulePublished,
  } = await import("@/lib/push-server");

  const published = input.assignments.filter((entry) => entry.status === "published" && entry.leader);
  if (published.length === 0) {
    return { groupSent: 0, leaderSent: 0 };
  }

  const scheduleSummary = published
    .slice(0, 6)
    .map(
      (entry) =>
        `${serviceDateTimeLabel(entry.serviceDate, entry.serviceTime)} — ${entry.leader?.name ?? "TBD"}`,
    )
    .join("; ");

  const groupResult = await notifyWorshipRotationSchedulePublished({
    groupId: getConfiguredWorshipGroupId(),
    body: scheduleSummary,
  });

  const grouped = new Map<string, { userId: string; dates: string[] }>();
  for (const entry of published) {
    if (!entry.leader) continue;
    const current = grouped.get(entry.leader.userId) ?? {
      userId: entry.leader.userId,
      dates: [],
    };
    current.dates.push(serviceDateTimeLabel(entry.serviceDate, entry.serviceTime));
    grouped.set(entry.leader.userId, current);
  }

  let leaderSent = 0;
  for (const entry of grouped.values()) {
    const dates = entry.dates.sort();
    const result = await notifyWorshipRotationLeaderAssignments({
      userId: entry.userId,
      datesSummary: dates.slice(0, 4).join(", ") + (dates.length > 4 ? ` +${dates.length - 4} more` : ""),
      nextDateLabel: dates[0] ?? "",
    });
    if (result.sent > 0) leaderSent += 1;
  }

  return { groupSent: groupResult.sent, leaderSent };
}

export async function approveAndNotifyWorshipRotationSchedule(actor: {
  id: string;
  name: string;
}) {
  const { approveWorshipRotationSchedule } = await import("@/lib/worship-rotation-server");
  const result = await approveWorshipRotationSchedule(actor);
  const notify = await publishWorshipRotationScheduleNotifications({
    assignments: result.assignments,
  });
  return { ...result, notify };
}

export { getConfiguredWorshipGroupId };
