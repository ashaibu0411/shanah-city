import {
  groupAssignmentsByUser,
  listUpcomingPrayerAssignments,
  markPrayerAssignmentsNotified,
  type ScheduleSlotType,
} from "@/lib/prayer-rotation-server";
import {
  formatPrayerAssignmentDate,
  SCHEDULE_SLOT_META,
} from "@/lib/prayer-schedule-types";
import {
  notifyPrayerLeaderAssignments,
  notifyPrayerSchedulePublished,
} from "@/lib/push-server";

export async function publishPrayerScheduleNotifications(slotType: ScheduleSlotType) {
  const meta = SCHEDULE_SLOT_META[slotType];
  const assignments = await listUpcomingPrayerAssignments(slotType);
  const published = assignments.filter((entry) => entry.status === "published");
  if (published.length === 0) {
    return { groupSent: 0, leaderSent: 0 };
  }

  const grouped = groupAssignmentsByUser(published);
  const scheduleSummary = published
    .slice(0, 6)
    .map((entry) => `${formatPrayerAssignmentDate(entry.assignmentDate)} — ${entry.userName}`)
    .join("; ");

  const groupResult = await notifyPrayerSchedulePublished({
    groupId: meta.notifyGroupId,
    slotType,
    body:
      scheduleSummary.length > 0
        ? scheduleSummary
        : `${meta.label} rotation is ready in the app.`,
  });

  let leaderSent = 0;
  const notifiedUserIds: string[] = [];

  for (const entry of grouped) {
    const result = await notifyPrayerLeaderAssignments({
      userId: entry.userId,
      slotType,
      datesSummary: entry.summary,
      nextDateLabel: entry.nextDateLabel,
    });
    if (result.sent > 0) {
      leaderSent += 1;
      notifiedUserIds.push(entry.userId);
    }
  }

  await markPrayerAssignmentsNotified(slotType, notifiedUserIds);

  return {
    groupSent: groupResult.sent,
    leaderSent,
  };
}

export async function approveAndNotifyPrayerSchedule(input: {
  slotType: ScheduleSlotType;
  actor: { id: string; name: string };
}) {
  const { approvePrayerSchedule } = await import("@/lib/prayer-rotation-server");
  const result = await approvePrayerSchedule(input);
  const notify = await publishPrayerScheduleNotifications(input.slotType);
  return { ...result, notify };
}
