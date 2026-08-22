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
import { isTrackedJoinMeeting } from "@/lib/meeting-catalog";
import { useDatabase } from "@/lib/use-database";
import {
  isNativePushConfigured,
  sendNativePush,
  shouldDropNativeToken,
} from "@/lib/native-push-server";

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

function configureWebPush() {
  if (!isWebPushConfigured()) return false;
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT!,
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!,
  );
  return true;
}

export async function sendTestPushToUser(userId: string) {
  const payload = {
    title: "Shanah City test alert",
    body: "Push notifications are working on this device.",
    url: "/profile",
  };
  const webConfigured = configureWebPush();
  const nativeConfigured = isNativePushConfigured();
  if (!webConfigured && !nativeConfigured) {
    return { sent: 0, skipped: 0, configured: false, errors: ["Push is not configured."] };
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
      await store().removePushSubscription(userId, record.endpoint);
      errors.push(`web:${error instanceof Error ? error.message : "send failed"}`);
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
  };
}

export async function sendPushToUsers(
  userIds: string[],
  payload: { title: string; body: string; url: string },
  preferenceKey: NotificationTopic,
) {
  const webConfigured = configureWebPush();
  const nativeConfigured = isNativePushConfigured();
  if (!webConfigured && !nativeConfigured) {
    return { sent: 0, skipped: userIds.length, configured: false };
  }

  const users = await getUsers();
  const subscriptions = webConfigured ? await store().getPushSubscriptions() : [];
  const nativeTokens = nativeConfigured ? await store().getNativePushTokens() : [];
  let sent = 0;
  let skipped = 0;
  let webSent = 0;
  let nativeSent = 0;
  const errors: string[] = [];

  for (const userId of userIds) {
    const user = users.find((item) => item.id === userId);
    const prefs: NotificationPrefs = {
      pushEnabled: user?.notificationPrefs?.pushEnabled ?? true,
      devotions: user?.notificationPrefs?.devotions ?? true,
      messages: user?.notificationPrefs?.messages ?? true,
      announcements: user?.notificationPrefs?.announcements ?? true,
      worship: user?.notificationPrefs?.worship ?? true,
      kids: user?.notificationPrefs?.kids ?? true,
    };

    if (!prefs.pushEnabled || !prefs[preferenceKey]) {
      skipped += 1;
      continue;
    }

    const userSubs = subscriptions.filter((item) => item.userId === userId);
    const userTokens = nativeTokens.filter((item) => item.userId === userId);
    if (userSubs.length === 0 && userTokens.length === 0) {
      skipped += 1;
      continue;
    }

    for (const record of userSubs) {
      try {
        await webpush.sendNotification(
          record.subscription,
          JSON.stringify(payload),
        );
        sent += 1;
        webSent += 1;
      } catch (error) {
        await store().removePushSubscription(userId, record.endpoint);
        skipped += 1;
        errors.push(
          `web:${error instanceof Error ? error.message : "send failed"}`,
        );
      }
    }

    for (const record of userTokens) {
      try {
        await sendNativePush(record, payload);
        sent += 1;
        nativeSent += 1;
      } catch (error) {
        if (shouldDropNativeToken(error)) {
          await store().removeNativePushToken(userId, record.token);
        }
        skipped += 1;
        errors.push(
          `${record.platform}:${error instanceof Error ? error.message : "send failed"}`,
        );
      }
    }
  }

  return {
    sent,
    skipped,
    webSent,
    nativeSent,
    errors: errors.slice(0, 3),
    configured: true,
  };
}

export async function notifyNewDevotion(input: {
  title: string;
  authorId: string;
}) {
  const users = await getUsers();
  const userIds = users
    .filter((user) => user.id !== input.authorId)
    .map((user) => user.id);

  return sendPushToUsers(
    userIds,
    {
      title: "New devotion ready",
      body: input.title,
      url: "/devotions",
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
      url: `/groups?group=${encodeURIComponent(input.groupId)}&chat=1`,
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
    return { sent: 0, skipped: 0, configured: isPushConfigured() };
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
      ? `/groups?group=${encodeURIComponent(input.targetGroupId)}`
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
  return sendPushToAllMembers(
    {
      title: input.title.toUpperCase(),
      body: `${input.schedule}. Tap to join on ${joinLabel}.`,
      url,
    },
    "announcements",
  );
}
