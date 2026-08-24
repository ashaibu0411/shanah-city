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

export { getConfiguredWorshipGroupId };
