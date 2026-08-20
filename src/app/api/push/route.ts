import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  getUserFromSession,
  SESSION_COOKIE,
  toPublicMember,
  updateNotificationPrefs,
} from "@/lib/auth-server";
import {
  getNativePushTokens,
  getPushSubscriptions,
  getVapidPublicKey,
  isPushConfigured,
  removeNativePushToken,
  removePushSubscription,
  saveNativePushToken,
  savePushSubscription,
} from "@/lib/push-server";

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  const user = await getUserFromSession(token);

  if (!user) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }

  const subscriptions = await getPushSubscriptions();
  const nativeTokens = await getNativePushTokens();
  const userWebSubs = subscriptions.filter((item) => item.userId === user.id);
  const userNativeTokens = nativeTokens.filter((item) => item.userId === user.id);
  const subscribed = userWebSubs.length > 0 || userNativeTokens.length > 0;

  return NextResponse.json({
    configured: isPushConfigured(),
    publicKey: getVapidPublicKey(),
    subscribed,
    devices: {
      web: userWebSubs.length,
      native: userNativeTokens.length,
    },
    preferences: user.notificationPrefs ?? {
      pushEnabled: true,
      devotions: true,
      messages: true,
      announcements: true,
      worship: true,
      kids: true,
    },
  });
}

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  const user = await getUserFromSession(token);

  if (!user) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }

  const body = await request.json();

  if (body.action === "preferences") {
    const updated = await updateNotificationPrefs(user.id, {
      pushEnabled:
        typeof body.pushEnabled === "boolean" ? body.pushEnabled : undefined,
      devotions: typeof body.devotions === "boolean" ? body.devotions : undefined,
      messages: typeof body.messages === "boolean" ? body.messages : undefined,
      announcements:
        typeof body.announcements === "boolean" ? body.announcements : undefined,
      worship: typeof body.worship === "boolean" ? body.worship : undefined,
      kids: typeof body.kids === "boolean" ? body.kids : undefined,
    });

    return NextResponse.json({
      user: updated ? toPublicMember(updated) : null,
    });
  }

  if (body.action === "subscribe") {
    if (!body.subscription?.endpoint) {
      return NextResponse.json({ error: "Invalid subscription." }, { status: 400 });
    }

    await savePushSubscription(user.id, body.subscription);
    const updated = await updateNotificationPrefs(user.id, { pushEnabled: true });

    return NextResponse.json({
      ok: true,
      user: updated ? toPublicMember(updated) : user,
    });
  }

  if (body.action === "native-subscribe") {
    const token = String(body.token ?? "").trim();
    const platform = body.platform === "ios" ? "ios" : body.platform === "android" ? "android" : "";
    if (!token || !platform) {
      return NextResponse.json({ error: "Native push token is required." }, { status: 400 });
    }

    await saveNativePushToken(user.id, token, platform);
    const updated = await updateNotificationPrefs(user.id, { pushEnabled: true });
    return NextResponse.json({
      ok: true,
      user: updated ? toPublicMember(updated) : user,
    });
  }

  return NextResponse.json({ error: "Unknown action." }, { status: 400 });
}

export async function DELETE() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  const user = await getUserFromSession(token);

  if (!user) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }

  await removePushSubscription(user.id);
  await removeNativePushToken(user.id);
  const updated = await updateNotificationPrefs(user.id, { pushEnabled: false });

  return NextResponse.json({
    ok: true,
    user: updated ? toPublicMember(updated) : null,
  });
}
