import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getUserFromSession, SESSION_COOKIE } from "@/lib/auth-server";
import { markFeedsRead } from "@/lib/feed-read-server";
import { getAppNotifications } from "@/lib/notification-server";
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

  const body = await request.json();

  if (body.action === "clearAllFeeds") {
    await markFeedsRead(user.id, FEED_READ_KEYS);
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
