import { getUserByEmail, getUserById } from "@/lib/auth-server";
import { getGroups } from "@/lib/group-server";
import {
  getAssistantAdminIds,
  isGroupLeaderOrAssistant,
  isGroupMember,
} from "@/lib/group-admin-utils";
import { ADMIN_GROUP_ID } from "@/lib/church-groups";
import { getPastoralReviewerUserIds as getPastoralRoleReviewerUserIds } from "@/lib/pastoral-roles-server";
import { getZonedDateParts } from "@/lib/denver-time";
import { sendDirectMessage } from "@/lib/message-server";
import {
  summarizeMinistryReports,
} from "@/lib/ministry-report-server";
import {
  formatReportMonth,
  isReportableMinistryGroup,
  previousReportMonth,
} from "@/lib/ministry-report-types";
import { notifyNewMessage, sendPushToUsers } from "@/lib/push-server";

const PASTORAL_GROUP_IDS = [ADMIN_GROUP_ID] as const;
const CHURCH_SENDER_NAME = "Shanah City";

function appBaseUrl() {
  return process.env.NEXT_PUBLIC_APP_URL?.trim() || "https://shanah-city.vercel.app";
}

function leaderFirstName(name: string) {
  return name.trim().split(/\s+/)[0] || name.trim() || "Leader";
}

async function resolveChurchNotifier() {
  const bootstrapEmail = process.env.ADMIN_BOOTSTRAP_EMAIL?.trim().toLowerCase();
  if (bootstrapEmail) {
    const user = await getUserByEmail(bootstrapEmail);
    if (user) return { id: user.id, name: CHURCH_SENDER_NAME };
  }

  const groups = await getGroups();
  const adminGroup = groups.find((group) => group.id === ADMIN_GROUP_ID);
  const adminId = adminGroup?.memberIds[0];
  if (adminId) {
    const user = await getUserById(adminId);
    if (user) return { id: user.id, name: CHURCH_SENDER_NAME };
  }

  return null;
}

async function getPastoralReviewerUserIds() {
  const groups = await getGroups();
  const userIds = new Set<string>(await getPastoralRoleReviewerUserIds());

  for (const groupId of PASTORAL_GROUP_IDS) {
    const group = groups.find((entry) => entry.id === groupId);
    if (!group) continue;
    for (const memberId of group.memberIds) {
      userIds.add(memberId);
    }
  }

  return [...userIds];
}

type LeaderReminderTarget = {
  userId: string;
  groups: Array<{ id: string; name: string }>;
};

async function getReportableMinistryLeaderTargets(): Promise<LeaderReminderTarget[]> {
  const groups = await getGroups();
  const byUser = new Map<string, Map<string, { id: string; name: string }>>();

  for (const group of groups) {
    if (!isReportableMinistryGroup(group)) continue;

    const candidateIds = new Set([...group.adminIds, ...getAssistantAdminIds(group)]);
    for (const userId of candidateIds) {
      if (!isGroupLeaderOrAssistant(group, userId) || !isGroupMember(group, userId)) continue;
      let userGroups = byUser.get(userId);
      if (!userGroups) {
        userGroups = new Map();
        byUser.set(userId, userGroups);
      }
      userGroups.set(group.id, { id: group.id, name: group.name });
    }
  }

  return [...byUser.entries()].map(([userId, groupMap]) => ({
    userId,
    groups: [...groupMap.values()].sort((left, right) => left.name.localeCompare(right.name)),
  }));
}

function buildLeaderReminderMessage(input: {
  recipientName: string;
  reportMonth: string;
  groups: Array<{ id: string; name: string }>;
}) {
  const monthLabel = formatReportMonth(input.reportMonth);
  const firstName = leaderFirstName(input.recipientName);
  const base = appBaseUrl();

  let message = `Hi ${firstName},\n\nThis is your monthly reminder to submit your ${monthLabel} ministry report. Please submit by the 5th.\n\n`;

  if (input.groups.length === 1) {
    const group = input.groups[0];
    message += `Team: ${group.name}\nOpen: ${base}/groups/${encodeURIComponent(group.id)}?report=1`;
  } else {
    message += "Your teams:\n";
    for (const group of input.groups) {
      message += `• ${group.name} — ${base}/groups/${encodeURIComponent(group.id)}?report=1\n`;
    }
  }

  message += `\nIn the app, open your team and use the Monthly report tab, then click Submit report (not Save draft).\n\n— Shanah City`;
  return message;
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

/** On the 1st (Denver), DM each reportable-ministry leader to submit the prior month's report by the 5th. */
export async function processLeaderReportReminders(reference = new Date()) {
  const denver = getZonedDateParts(reference);
  const day = Number(denver.day);

  if (day !== 1) {
    return {
      sent: 0,
      skipped: true,
      reason: "not_first_of_month",
      denverDate: denver.dateKey,
    };
  }

  const reportMonth = previousReportMonth(reference);
  const targets = await getReportableMinistryLeaderTargets();
  if (targets.length === 0) {
    return {
      sent: 0,
      skipped: true,
      reason: "no_leaders",
      reportMonth,
      denverDate: denver.dateKey,
    };
  }

  const sender = await resolveChurchNotifier();
  if (!sender) {
    return {
      sent: 0,
      skipped: true,
      reason: "no_notifier",
      reportMonth,
      leaders: targets.length,
      denverDate: denver.dateKey,
    };
  }

  let sent = 0;
  let failed = 0;

  for (const target of targets) {
    const recipient = await getUserById(target.userId);
    if (!recipient) {
      failed += 1;
      continue;
    }

    const content = buildLeaderReminderMessage({
      recipientName: recipient.name,
      reportMonth,
      groups: target.groups,
    });

    try {
      const result = await sendDirectMessage({
        senderId: sender.id,
        senderName: sender.name,
        recipientId: recipient.id,
        recipientName: recipient.name,
        content,
      });

      await notifyNewMessage({
        recipientId: recipient.id,
        senderName: sender.name,
        preview: content,
        threadId: result.thread.id,
      });

      sent += 1;
    } catch (error) {
      console.error("Ministry report leader reminder failed:", error);
      failed += 1;
    }
  }

  return {
    sent,
    failed,
    skipped: false,
    reportMonth,
    leaders: targets.length,
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
