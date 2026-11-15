import { prisma } from "@/lib/db";
import { sendPushToUsers } from "@/lib/push-server";

function denverDay(now: Date): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Denver", year: "numeric", month: "2-digit", day: "2-digit",
  }).formatToParts(now);
  const get = (type: string) => parts.find(part => part.type === type)?.value || "";
  return get("year") + "-" + get("month") + "-" + get("day");
}

function dayDelta(from: string, to: string) {
  return Math.round((Date.parse(to + "T00:00:00Z") - Date.parse(from + "T00:00:00Z")) / 86400000);
}

/** Deduplicate before delivery, including simultaneous Vercel Cron retries. */
async function notifyOnce(milestoneId: string, recipientId: string, key: string, text: string, planId: string) {
  try {
    await prisma.visionReminderDelivery.create({ data: { milestoneId, recipientId, key } });
  } catch (error) {
    // P2002 = prior delivery claim; don't resend. Unexpected errors must surface.
    if ((error as { code?: string })?.code === "P2002") return false;
    throw error;
  }
  try {
    await sendPushToUsers([recipientId], {
      title: "2027 Vision Center",
      body: text,
      url: "/leadership/vision/" + encodeURIComponent(planId),
    }, "announcements");
  } catch (error) {
    // A failed push is not silently re-sent forever; the in-app milestone remains visible.
    console.error("[vision-cron] push delivery failed", error);
  }
  return true;
}

export async function processVisionReminders(now = new Date()) {
  const today = denverDay(now);
  const month = today.slice(0, 7);
  const dayOfMonth = Number(today.slice(8, 10));
  const milestones = await prisma.visionMilestone.findMany({
    where: { status: "pending", plan: { status: "approved", year: 2027 }, dueOn: { gte: today } },
    select: { id: true, planId: true, assigneeId: true, title: true, kind: true, dueOn: true },
    orderBy: { dueOn: "asc" },
    take: 3000,
  });
  let claimed = 0;
  const byLeaderPlan = new Map<string, typeof milestones>();
  for (const task of milestones) {
    const key = task.planId + ":" + task.assigneeId;
    const group = byLeaderPlan.get(key) ?? [];
    group.push(task);
    byLeaderPlan.set(key, group);
  }
  // One consolidated monthly preview per leader per plan, not one alert for every responsibility.
  if (dayOfMonth === 1) {
    for (const tasks of byLeaderPlan.values()) {
      const upcoming = tasks.filter(t => t.dueOn.startsWith(month));
      if (!upcoming.length) continue;
      if (await notifyOnce(upcoming[0].id, upcoming[0].assigneeId, "month-start:" + month,
        "Your " + month + " ministry responsibilities are ready. Review your leadership checklist.",
        upcoming[0].planId)) claimed++;
    }
  }
  for (const task of milestones) {
    const days = dayDelta(today, task.dueOn);
    // Monthly checkpoints have the consolidated month preview; don't spam for them.
    if (task.kind === "monthly-direction" || task.kind === "men-sunday") continue;
    const keys: string[] = [];
    if (days === 7) keys.push("week-before");
    if (days === 1) keys.push("day-before");
    if (task.kind === "men-fathers-day") {
      if ([90, 60, 30].includes(days)) keys.push("fathers-day-" + days);
    }
    for (const key of keys) {
      const body = key.startsWith("fathers-day")
        ? "Father's Day leadership planning checkpoint: " + days + " days remaining."
        : (days === 7 ? "Coming up this week: " : "Due tomorrow: ") + task.title;
      if (await notifyOnce(task.id, task.assigneeId, key, body, task.planId)) claimed++;
    }
  }
  return { date: today, pending: milestones.length, reminderClaims: claimed };
}
