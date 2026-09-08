import { getGroups } from "@/lib/group-server";
import { isGroupMember } from "@/lib/group-admin-utils";
import {
  ADMIN_GROUP_ID,
  ASSOCIATE_PASTOR_GROUP_ID,
  SENIOR_PASTOR_GROUP_ID,
} from "@/lib/church-groups";
import { getZonedDateParts } from "@/lib/denver-time";
import {
  getMinistryReport,
  summarizeMinistryReports,
} from "@/lib/ministry-report-server";
import {
  formatReportMonth,
  isReportableMinistryGroup,
  previousReportMonth,
} from "@/lib/ministry-report-types";
import { sendPushToUsers } from "@/lib/push-server";

const PASTORAL_GROUP_IDS = [
  ADMIN_GROUP_ID,
  SENIOR_PASTOR_GROUP_ID,
  ASSOCIATE_PASTOR_GROUP_ID,
] as const;

async function getPastoralReviewerUserIds() {
  const groups = await getGroups();
  const userIds = new Set<string>();

  for (const groupId of PASTORAL_GROUP_IDS) {
    const group = groups.find((entry) => entry.id === groupId);
    if (!group) continue;
    for (const memberId of group.memberIds) {
      userIds.add(memberId);
    }
  }

  return [...userIds];
}

async function getLeaderIdsMissingReport(reportMonth: string) {
  const groups = await getGroups();
  const leaderIds = new Set<string>();

  for (const group of groups) {
    if (!isReportableMinistryGroup(group)) continue;
    const report = await getMinistryReport(reportMonth, group.id);
    const isComplete =
      report &&
      (report.status === "submitted" ||
        report.status === "reviewed" ||
        report.status === "returned");
    if (isComplete) continue;

    for (const adminId of group.adminIds) {
      if (isGroupMember(group, adminId)) {
        leaderIds.add(adminId);
      }
    }
  }

  return [...leaderIds];
}

export async function notifyPastoralReviewersOfSubmission(input: {
  groupName: string;
  reportMonth: string;
}) {
  const userIds = await getPastoralReviewerUserIds();
  if (userIds.length === 0) {
    return { sent: 0, skipped: 0, configured: false };
  }

  const monthLabel = formatReportMonth(input.reportMonth);
  return sendPushToUsers(
    userIds,
    {
      title: "Leader report submitted",
      body: `${input.groupName} submitted the ${monthLabel} report. Tap to review.`,
      url: "/admin/reports?section=leaders",
    },
    "announcements",
  );
}

export async function processLeaderReportReminders(reference = new Date()) {
  const denver = getZonedDateParts(reference);
  const day = Number(denver.day);
  const lastDay = new Date(Number(denver.year), Number(denver.month), 0).getDate();
  const isReminderDay = day >= 25 || day === lastDay;

  if (!isReminderDay) {
    return {
      sent: 0,
      skipped: true,
      reason: "not_reminder_day",
      denverDate: denver.dateKey,
    };
  }

  const reportMonth = previousReportMonth(reference);
  const leaderIds = await getLeaderIdsMissingReport(reportMonth);
  if (leaderIds.length === 0) {
    return {
      sent: 0,
      skipped: true,
      reason: "all_reports_in",
      reportMonth,
      denverDate: denver.dateKey,
    };
  }

  const monthLabel = formatReportMonth(reportMonth);
  const result = await sendPushToUsers(
    leaderIds,
    {
      title: "Monthly leader report",
      body: `Your ${monthLabel} ministry report is still due. Tap to submit from your group.`,
      url: "/groups",
    },
    "announcements",
  );

  return {
    ...result,
    reportMonth,
    leaders: leaderIds.length,
    denverDate: denver.dateKey,
  };
}

export async function processPastoralReportDigest(reference = new Date()) {
  const denver = getZonedDateParts(reference);
  const day = Number(denver.day);
  if (day > 7) {
    return {
      sent: 0,
      skipped: true,
      reason: "outside_digest_window",
      denverDate: denver.dateKey,
    };
  }

  const reportMonth = previousReportMonth(reference);
  const summary = await summarizeMinistryReports(reportMonth);
  const awaitingReview = summary.groups.filter((group) => group.status === "submitted").length;
  const missing = summary.missing;

  if (awaitingReview === 0 && missing === 0) {
    return {
      sent: 0,
      skipped: true,
      reason: "nothing_to_review",
      reportMonth,
      denverDate: denver.dateKey,
    };
  }

  const userIds = await getPastoralReviewerUserIds();
  if (userIds.length === 0) {
    return { sent: 0, skipped: true, reason: "no_reviewers", reportMonth };
  }

  const monthLabel = formatReportMonth(reportMonth);
  const body =
    awaitingReview > 0
      ? `${awaitingReview} report${awaitingReview === 1 ? "" : "s"} awaiting review for ${monthLabel}.${missing > 0 ? ` ${missing} still missing.` : ""}`
      : `${missing} leader report${missing === 1 ? "" : "s"} still missing for ${monthLabel}.`;

  const result = await sendPushToUsers(
    userIds,
    {
      title: "Leader reports update",
      body,
      url: "/admin/reports?section=leaders",
    },
    "announcements",
  );

  return {
    ...result,
    reportMonth,
    awaitingReview,
    missing,
    denverDate: denver.dateKey,
  };
}

export async function processMinistryReportNotifications(reference = new Date()) {
  const [leader, pastoral] = await Promise.all([
    processLeaderReportReminders(reference),
    processPastoralReportDigest(reference),
  ]);

  return { leader, pastoral };
}
