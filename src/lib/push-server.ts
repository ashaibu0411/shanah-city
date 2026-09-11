import webpush from "web-push";
import { getUsers } from "@/lib/auth-server";
import type { NotificationPrefs, NotificationTopic } from "@/lib/auth-types";
import { getGroups } from "@/lib/group-server";
import {
  rehearsalDateTimeLabel,
  serviceDateTimeLabel,
} from "@/lib/worship-types";
import * as pushDb from "@/lib/stores/push-db";
import * as pushJson from "@/lib/stores/push-json";
import { isTrackedJoinMeeting, isAutomatedReminderMeeting, MANUAL_PUSH_MEETING_GROUP_IDS } from "@/lib/meeting-catalog";
import { useDatabase } from "@/lib/use-database";
import {
  isNativePushConfigured,
  sendNativePush,
  shouldDropNativeToken,
} from "@/lib/native-push-server";
import { withPushBranding } from "@/lib/push-branding";
import {
  emptyPushDeliveryResult,
  getScheduledPushEligibility,
  preferenceMatchesAnyTopic,
  preferenceMatchesTopic,
  resolveNotificationPrefs,
  type PushDeliveryResult,
} from "@/lib/push-delivery-utils";

export type { PushDeliveryResult } from "@/lib/push-delivery-utils";
export { shouldMarkScheduledPushComplete } from "@/lib/push-delivery-utils";

const store = () => (useDatabase() ? pushDb : pushJson);

export type { StoredNativePushToken, StoredPushSubscription } from "@/lib/stores/push-json";

export const getPushSubscriptions = () => store().getPushSubscriptions();
export const savePushSubscription = (
  userId: string,
  subscription: webpush.PushSubscription,
) => store().savePushSubscription(userId, subscription);
export const removePushSubscription = (userId: string, endpoint?: string) =>
  store().removePushSubscription(userId, endpoint);
export const getNativePushTokens = () => store().getNativePushTokens();
export const saveNativePushToken = (
  userId: string,
  token: string,
  platform: "ios" | "android",
) => store().saveNativePushToken(userId, token, platform);
export const removeNativePushToken = (userId: string, token?: string) =>
  store().removeNativePushToken(userId, token);

export function getVapidPublicKey() {
  return process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "";
}

function isWebPushConfigured() {
  return Boolean(
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY?.trim() &&
      process.env.VAPID_PRIVATE_KEY?.trim() &&
      process.env.VAPID_SUBJECT?.trim(),
  );
}

export function isPushConfigured() {
  return isWebPushConfigured() || isNativePushConfigured();
}

function shouldDropWebPushSubscription(error: unknown) {
  const statusCode = (error as { statusCode?: number })?.statusCode;
  return statusCode === 404 || statusCode === 410;
}

function configureWebPush() {
  if (!isWebPushConfigured()) return false;
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT!,
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!,
  );
  return true;
}

export async function sendTestPushToUser(
  userId: string,
  prefs?: Partial<NotificationPrefs> | null,
) {
  const payload = withPushBranding({
    title: "Shanah City test alert",
    body: "Push notifications are working on this device.",
    url: "/profile",
  });
  const scheduleEligibility = getScheduledPushEligibility(resolveNotificationPrefs(prefs));
  const webConfigured = configureWebPush();
  const nativeConfigured = isNativePushConfigured();
  if (!webConfigured && !nativeConfigured) {
    return {
      sent: 0,
      skipped: 0,
      configured: false,
      errors: ["Push is not configured."],
      scheduleEligibility,
    };
  }

  const subscriptions = webConfigured
    ? (await store().getPushSubscriptions()).filter((item) => item.userId === userId)
    : [];
  const nativeTokens = nativeConfigured
    ? (await store().getNativePushTokens()).filter((item) => item.userId === userId)
    : [];

  if (subscriptions.length === 0 && nativeTokens.length === 0) {
    return {
      sent: 0,
      skipped: 1,
      configured: true,
      errors: ["No registered devices found for this account."],
      scheduleEligibility,
    };
  }

  let sent = 0;
  let webSent = 0;
  let nativeSent = 0;
  const errors: string[] = [];

  for (const record of subscriptions) {
    try {
      await webpush.sendNotification(record.subscription, JSON.stringify(payload));
      sent += 1;
      webSent += 1;
    } catch (error) {
      if (shouldDropWebPushSubscription(error)) {
        await store().removePushSubscription(userId, record.endpoint);
      }
      errors.push(
        `web:${error instanceof Error ? error.message : "send failed"}`,
      );
    }
  }

  for (const record of nativeTokens) {
    try {
      await sendNativePush(record, payload);
      sent += 1;
      nativeSent += 1;
    } catch (error) {
      if (shouldDropNativeToken(error)) {
        await store().removeNativePushToken(userId, record.token);
      }
      errors.push(
        `${record.platform}:${error instanceof Error ? error.message : "send failed"}`,
      );
    }
  }

  return {
    sent,
    skipped: errors.length,
    webSent,
    nativeSent,
    errors,
    configured: true,
    scheduleEligibility,
  };
}

async function dispatchPushToUsers(
  userIds: string[],
  payload: { title: string; body: string; url: string },
  passesPreference: (prefs: NotificationPrefs) => boolean,
): Promise<PushDeliveryResult> {
  const brandedPayload = withPushBranding(payload);
  const webConfigured = configureWebPush();
  const nativeConfigured = isNativePushConfigured();
  if (!webConfigured && !nativeConfigured) {
    return emptyPushDeliveryResult(false);
  }

  const users = await getUsers();
  const subscriptions = webConfigured ? await store().getPushSubscriptions() : [];
  const nativeTokens = nativeConfigured ? await store().getNativePushTokens() : [];
  const result = emptyPushDeliveryResult(true);

  for (const userId of userIds) {
    const user = users.find((item) => item.id === userId);
    const prefs = resolveNotificationPrefs(user?.notificationPrefs);

    if (!passesPreference(prefs)) {
      result.skippedPrefUsers += 1;
      result.skipped += 1;
      continue;
    }

    const userSubs = subscriptions.filter((item) => item.userId === userId);
    const userTokens = nativeTokens.filter((item) => item.userId === userId);
    if (userSubs.length === 0 && userTokens.length === 0) {
      result.skippedNoDeviceUsers += 1;
      result.skipped += 1;
      continue;
    }

    result.eligibleUsers += 1;
    let userDelivered = false;
    let userFailed = false;

    for (const record of userSubs) {
      try {
        await webpush.sendNotification(
          record.subscription,
          JSON.stringify(brandedPayload),
        );
        result.sent += 1;
        result.webSent += 1;
        userDelivered = true;
      } catch (error) {
        userFailed = true;
        if (shouldDropWebPushSubscription(error)) {
          await store().removePushSubscription(userId, record.endpoint);
        }
        result.skipped += 1;
        result.errors.push(
          `web:${error instanceof Error ? error.message : "send failed"}`,
        );
      }
    }

    for (const record of userTokens) {
      try {
        await sendNativePush(record, brandedPayload);
        result.sent += 1;
        result.nativeSent += 1;
        userDelivered = true;
      } catch (error) {
        userFailed = true;
        if (shouldDropNativeToken(error)) {
          await store().removeNativePushToken(userId, record.token);
        }
        result.skipped += 1;
        result.errors.push(
          `${record.platform}:${error instanceof Error ? error.message : "send failed"}`,
        );
      }
    }

    if (userDelivered) {
      result.deliveredUsers += 1;
    } else if (userFailed) {
      result.failedUsers += 1;
    }
  }

  result.errors = result.errors.slice(0, 3);
  return result;
}

export async function sendPushToUsers(
  userIds: string[],
  payload: { title: string; body: string; url: string },
  preferenceKey: NotificationTopic,
) {
  return dispatchPushToUsers(userIds, payload, (prefs) =>
    preferenceMatchesTopic(prefs, preferenceKey),
  );
}

export async function sendPushToUsersWithAnyPreference(
  userIds: string[],
  payload: { title: string; body: string; url: string },
  preferenceKeys: NotificationTopic[],
) {
  return dispatchPushToUsers(userIds, payload, (prefs) =>
    preferenceMatchesAnyTopic(prefs, preferenceKeys),
  );
}

export async function notifyNewDevotion(input: {
  title: string;
  devotionId?: string;
}) {
  const users = await getUsers();
  const userIds = users.map((user) => user.id);

  const url = input.devotionId
    ? `/devotions/${encodeURIComponent(input.devotionId)}`
    : "/devotions";

  return sendPushToUsers(
    userIds,
    {
      title: "New devotion ready",
      body: input.title,
      url,
    },
    "devotions",
  );
}

export async function notifyNewMessage(input: {
  recipientId: string;
  senderName: string;
  preview: string;
  threadId: string;
}) {
  return sendPushToUsers(
    [input.recipientId],
    {
      title: `Message from ${input.senderName}`,
      body: input.preview,
      url: `/messages?thread=${encodeURIComponent(input.threadId)}`,
    },
    "messages",
  );
}

export async function notifyGroupChatMessage(input: {
  groupId: string;
  groupName: string;
  senderId: string;
  senderName: string;
  preview: string;
}) {
  return sendPushToGroupMembers(
    input.groupId,
    {
      title: input.groupName,
      body: `${input.senderName}: ${input.preview}`,
      url: `/groups/${encodeURIComponent(input.groupId)}?chat=1`,
    },
    "messages",
    input.senderId,
  );
}

export async function sendPushToGroupMembers(
  groupId: string,
  payload: { title: string; body: string; url: string },
  preferenceKey: NotificationTopic,
  excludeUserId?: string,
) {
  const groups = await getGroups();
  const group = groups.find((entry) => entry.id === groupId);
  if (!group) {
    return emptyPushDeliveryResult(isPushConfigured());
  }

  const userIds = group.memberIds.filter((memberId) => memberId !== excludeUserId);
  return sendPushToUsers(userIds, payload, preferenceKey);
}

export async function sendPushToAllMembers(
  payload: { title: string; body: string; url: string },
  preferenceKey: NotificationTopic,
  excludeUserId?: string,
) {
  const users = await getUsers();
  const userIds = users
    .filter((user) => user.id !== excludeUserId)
    .map((user) => user.id);

  return sendPushToUsers(userIds, payload, preferenceKey);
}

export async function notifyPollCreated(input: {
  authorId?: string;
  authorName: string;
  question: string;
  targetGroupId?: string;
  targetGroupName?: string;
}) {
  const title = input.targetGroupName
    ? `${input.targetGroupName} poll`
    : "Church poll";
  const payload = {
    title,
    body: `${input.authorName}: ${input.question.slice(0, 120)}`,
    url: input.targetGroupId
      ? `/groups/${encodeURIComponent(input.targetGroupId)}`
      : "/community",
  };

  if (input.targetGroupId) {
    return sendPushToGroupMembers(
      input.targetGroupId,
      payload,
      "announcements",
      input.authorId,
    );
  }

  return sendPushToAllMembers(payload, "announcements", input.authorId);
}

export async function notifyCommunityPost(input: {
  authorId?: string;
  authorName: string;
  content: string;
  type: "prayer" | "praise" | "announcement";
  targetGroupId?: string;
  targetGroupName?: string;
}) {
  const titles = {
    prayer: "New prayer on the wall",
    praise: "New praise shared",
    announcement: input.targetGroupName
      ? `${input.targetGroupName} announcement`
      : "Church announcement",
  };

  const payload = {
    title: titles[input.type],
    body: `${input.authorName}: ${input.content.slice(0, 120)}`,
    url: "/community",
  };

  if (input.type === "announcement" && input.targetGroupId) {
    return sendPushToGroupMembers(
      input.targetGroupId,
      payload,
      "announcements",
      input.authorId,
    );
  }

  return sendPushToAllMembers(payload, "announcements", input.authorId);
}

export async function notifyNewMediaClip(input: {
  authorId?: string;
  title: string;
}) {
  return sendPushToAllMembers(
    {
      title: "New short video",
      body: input.title,
      url: "/live",
    },
    "announcements",
    input.authorId,
  );
}

export async function notifyWorshipPlanPublished(input: {
  teamUserIds: string[];
  title: string;
  serviceDate: string;
  serviceTime: string;
}) {
  return sendPushToUsers(
    input.teamUserIds,
    {
      title: "New worship plan published",
      body: input.title,
      url: `/worship?date=${encodeURIComponent(input.serviceDate)}&time=${encodeURIComponent(input.serviceTime)}`,
    },
    "worship",
  );
}

export async function notifyWorshipRehearsalReminder(plan: {
  team: { userId: string }[];
  serviceDate: string;
  serviceTime: string;
  rehearsalDate?: string | null;
  rehearsalTime?: string | null;
  title?: string | null;
}) {
  const body = plan.rehearsalDate
    ? `Rehearsal ${rehearsalDateTimeLabel(plan.rehearsalDate, plan.rehearsalTime)} for ${serviceDateTimeLabel(plan.serviceDate, plan.serviceTime)}`
    : serviceDateTimeLabel(plan.serviceDate, plan.serviceTime);

  return sendPushToUsers(
    plan.team.map((member) => member.userId),
    {
      title: "Worship rehearsal reminder",
      body,
      url: `/worship?date=${encodeURIComponent(plan.serviceDate)}&time=${encodeURIComponent(plan.serviceTime)}`,
    },
    "worship",
  );
}

export async function notifyWorshipUploadDutyReminder(input: {
  userId: string;
  serviceDate: string;
  serviceTime: string;
  title: string;
}) {
  return sendPushToUsers(
    [input.userId],
    {
      title: "Your turn to upload songs",
      body: `Add songs and YouTube links for ${input.title} before rehearsal.`,
      url: `/worship?date=${encodeURIComponent(input.serviceDate)}&time=${encodeURIComponent(input.serviceTime)}`,
    },
    "worship",
  );
}

export async function notifyPrayerSchedulePublished(input: {
  groupId: string;
  slotType: "morning" | "evening";
  body: string;
}) {
  const title =
    input.slotType === "morning"
      ? "Shift Your Morning schedule published"
      : "Shift Your Evening schedule published";
  return sendPushToGroupMembers(
    input.groupId,
    {
      title,
      body: input.body,
      url: "/meetings",
    },
    "devotions",
  );
}

export async function notifyPrayerLeaderAssignments(input: {
  userId: string;
  slotType: "morning" | "evening";
  datesSummary: string;
  nextDateLabel: string;
}) {
  const title =
    input.slotType === "morning"
      ? "Your Shift Your Morning dates"
      : "Your Shift Your Evening dates";
  return sendPushToUsers(
    [input.userId],
    {
      title,
      body: input.nextDateLabel
        ? `You're scheduled to lead on ${input.datesSummary}. Next up: ${input.nextDateLabel}.`
        : `You're scheduled to lead on ${input.datesSummary}.`,
      url: "/meetings",
    },
    "devotions",
  );
}

export async function notifyWorshipRotationSchedulePublished(input: {
  groupId: string;
  body: string;
}) {
  return sendPushToGroupMembers(
    input.groupId,
    {
      title: "Worship leader schedule published",
      body: input.body,
      url: "/worship?tab=schedule",
    },
    "worship",
  );
}

export async function notifyWorshipRotationLeaderAssignments(input: {
  userId: string;
  datesSummary: string;
  nextDateLabel: string;
}) {
  return sendPushToUsers(
    [input.userId],
    {
      title: "Your worship leader dates",
      body: input.nextDateLabel
        ? `You're scheduled to lead on ${input.datesSummary}. Next up: ${input.nextDateLabel}.`
        : `You're scheduled to lead on ${input.datesSummary}.`,
      url: "/worship?tab=schedule",
    },
    "worship",
  );
}

export async function notifyChurchEvent(input: {
  title: string;
  authorId: string;
  eventId: string;
}) {
  return sendPushToAllMembers(
    {
      title: "Church event",
      body: input.title,
      url: `/calendar?event=${encodeURIComponent(input.eventId)}`,
    },
    "announcements",
    input.authorId,
  );
}

export async function notifyChurchAnnouncement(input: {
  authorId?: string;
  authorName: string;
  content: string;
  campusId?: string;
}) {
  return notifyCommunityPost({
    authorId: input.authorId,
    authorName: input.authorName,
    content: input.content,
    type: "announcement",
  });
}

export async function notifyScheduledMeeting(input: {
  id: string;
  title: string;
  schedule: string;
  platform?: string;
}) {
  const joinLabel = input.platform === "teams" ? "Teams" : "Zoom";
  const url = isTrackedJoinMeeting(input.id)
    ? `/api/meetings/join?meetingId=${encodeURIComponent(input.id)}&source=push`
    : "/meetings";
  const payload = {
    title: input.title.toUpperCase(),
    body: `${input.schedule}. Tap to join on ${joinLabel}.`,
    url,
  };
  const users = await getUsers();
  const userIds = users.map((user) => user.id);

  if (isAutomatedReminderMeeting(input.id)) {
    return sendPushToUsersWithAnyPreference(userIds, payload, [
      "devotions",
      "announcements",
      "worship",
    ]);
  }

  const groupId = MANUAL_PUSH_MEETING_GROUP_IDS[input.id];
  if (groupId) {
    return sendPushToGroupMembers(groupId, payload, "worship");
  }

  return sendPushToUsers(userIds, payload, "worship");
}

export async function notifyLiveStreamNow(input: {
  authorId?: string;
  title: string;
  body?: string;
}) {
  const title = input.title.trim() || "Shanah City is live";
  const body = input.body?.trim() || "Tap to watch the livestream in the app.";

  return sendPushToAllMembers(
    {
      title: title.toLowerCase().includes("live") ? title : `Live now: ${title}`,
      body,
      url: "/live",
    },
    "announcements",
    input.authorId,
  );
}

function eventRsvpDeadlineLabel(deadline?: string | null) {
  if (!deadline) return null;
  return new Date(deadline).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export async function notifyEventRsvpRequest(input: {
  eventId: string;
  title: string;
  authorId?: string;
  targetGroupId?: string | null;
  isReminder?: boolean;
  deadline?: string | null;
}) {
  const deadlineLabel = eventRsvpDeadlineLabel(input.deadline);
  const title = input.isReminder ? `RSVP reminder: ${input.title}` : `RSVP: ${input.title}`;
  const body = deadlineLabel
    ? `Let us know if you're coming by ${deadlineLabel}.`
    : "Tap to respond in the calendar.";
  const payload = {
    title,
    body,
    url: `/calendar?event=${encodeURIComponent(input.eventId)}`,
  };

  if (input.targetGroupId) {
    return sendPushToGroupMembers(
      input.targetGroupId,
      payload,
      "announcements",
      input.authorId,
    );
  }

  return sendPushToAllMembers(payload, "announcements", input.authorId);
}
