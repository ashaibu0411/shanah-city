import { markPushInboxRead } from "@/lib/push-inbox-server";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getUserFromSession, SESSION_COOKIE } from "@/lib/auth-server";
import { markFeedsRead } from "@/lib/feed-read-server";
import { getAppNotifications, getRawAppNotificationItems } from "@/lib/notification-server";
import {
  clearAllMemberNotificationsWithBadge,
  dismissNotificationItem,
  markAllMemberNotificationsReadWithBadge,
} from "@/lib/notification-actions-server";
import { syncNativeAppBadgeForUser } from "@/lib/native-push-server";
import { FEED_READ_KEYS, type FeedReadKey } from "@/lib/notification-types";

export async function GET(request: Request) {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  const user = await getUserFromSession(token);

  if (!user) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }

  const summary = await getAppNotifications(user.id);
  if (request.headers.get("x-sync-app-badge") === "1") {
    void syncNativeAppBadgeForUser(user.id, summary.total);
  }
  return NextResponse.json(summary);
}

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  const user = await getUserFromSession(token);

  if (!user) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  if (body.action === "clearAllFeeds" || body.action === "clearAll") {
    const summary = await clearAllMemberNotificationsWithBadge(user.id);
    return NextResponse.json(summary);
  }

  if (body.action === "markAllAsRead") {
    const summary = await markAllMemberNotificationsReadWithBadge(user.id);
    return NextResponse.json(summary);
  }

  if (body.action === "dismissItem") {
    const requested = body.item;
    if (typeof requested?.id !== "string" || typeof requested?.type !== "string" || typeof requested?.at !== "string") {
      return NextResponse.json({ error: "Notification item required." }, { status: 400 });
    }
    const items = await getRawAppNotificationItems(user.id);
    const item = items.find((candidate) => candidate.id === requested.id && candidate.type === requested.type);
    if (!item) return NextResponse.json({ error: "Notification not found." }, { status: 404 });
    if (item.at !== requested.at) return NextResponse.json({ error: "Notification changed. Refresh and retry." }, { status: 409 });
    await dismissNotificationItem(user.id, item);
    const summary = await getAppNotifications(user.id);
    void syncNativeAppBadgeForUser(user.id, summary.total);
    return NextResponse.json(summary);
  }

  if (body.action === "markPushRead") {
    const ids = Array.isArray(body.ids) ? body.ids.filter((id: unknown): id is string => typeof id === "string").map((id: string) => id.replace(/^push-/, "")) : [];
    if (!ids.length) return NextResponse.json({error:"Push item ids required."},{status:400});
    const items = await getRawAppNotificationItems(user.id);
    const allowed = new Set(items.filter((item) => item.type === "push").map((item) => item.id.replace(/^push-/, "")));
    await markPushInboxRead(user.id, ids.filter((id: string) => allowed.has(id)));
    const summary = await getAppNotifications(user.id);
    void syncNativeAppBadgeForUser(user.id, summary.total);
    return NextResponse.json(summary);
  }
  if (body.action !== "markFeedRead") {
    return NextResponse.json({ error: "Unknown action." }, { status: 400 });
  }

  const feeds = Array.isArray(body.feeds) ? body.feeds : body.feed ? [body.feed] : [];
  const validFeeds = feeds.filter((feed: string): feed is FeedReadKey =>
    FEED_READ_KEYS.includes(feed as FeedReadKey),
  );

  if (validFeeds.length === 0) {
    return NextResponse.json({ error: "Feed key is required." }, { status: 400 });
  }

  await markFeedsRead(user.id, validFeeds);
  const summary = await getAppNotifications(user.id);
  void syncNativeAppBadgeForUser(user.id, summary.total);
  return NextResponse.json(summary);
}
