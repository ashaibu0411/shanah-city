import webpush from "web-push";
import { getUsers } from "@/lib/auth-server";
import type { NotificationPrefs, NotificationTopic } from "@/lib/auth-types";
import * as pushDb from "@/lib/stores/push-db";
import * as pushJson from "@/lib/stores/push-json";
import { useDatabase } from "@/lib/use-database";

const store = () => (useDatabase() ? pushDb : pushJson);

export type { StoredPushSubscription } from "@/lib/stores/push-json";

export const getPushSubscriptions = () => store().getPushSubscriptions();
export const savePushSubscription = (
  userId: string,
  subscription: webpush.PushSubscription,
) => store().savePushSubscription(userId, subscription);
export const removePushSubscription = (userId: string, endpoint?: string) =>
  store().removePushSubscription(userId, endpoint);

export function getVapidPublicKey() {
  return process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "";
}

export function isPushConfigured() {
  return Boolean(
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY &&
      process.env.VAPID_PRIVATE_KEY &&
      process.env.VAPID_SUBJECT,
  );
}

function configureWebPush() {
  if (!isPushConfigured()) return false;
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT!,
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!,
  );
  return true;
}

export async function sendPushToUsers(
  userIds: string[],
  payload: { title: string; body: string; url: string },
  preferenceKey: NotificationTopic,
) {
  if (!configureWebPush()) {
    return { sent: 0, skipped: userIds.length, configured: false };
  }

  const users = await getUsers();
  const subscriptions = await store().getPushSubscriptions();
  let sent = 0;
  let skipped = 0;

  for (const userId of userIds) {
    const user = users.find((item) => item.id === userId);
    const prefs: NotificationPrefs = {
      pushEnabled: user?.notificationPrefs?.pushEnabled ?? true,
      devotions: user?.notificationPrefs?.devotions ?? true,
      messages: user?.notificationPrefs?.messages ?? true,
      announcements: user?.notificationPrefs?.announcements ?? true,
    };

    if (!prefs.pushEnabled || !prefs[preferenceKey]) {
      skipped += 1;
      continue;
    }

    const userSubs = subscriptions.filter((item) => item.userId === userId);
    if (userSubs.length === 0) {
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
      } catch {
        await store().removePushSubscription(userId, record.endpoint);
        skipped += 1;
      }
    }
  }

  return { sent, skipped, configured: true };
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

export async function notifyChurchAnnouncement(input: {
  authorId?: string;
  authorName: string;
  content: string;
  campusId?: string;
}) {
  const users = await getUsers();
  const userIds = users
    .filter((user) => user.id !== input.authorId)
    .map((user) => user.id);

  return sendPushToUsers(
    userIds,
    {
      title: "Church announcement",
      body: `${input.authorName}: ${input.content.slice(0, 120)}`,
      url: "/community",
    },
    "announcements",
  );
}
