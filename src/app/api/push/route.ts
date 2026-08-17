import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  getUserFromSession,
  SESSION_COOKIE,
  toPublicMember,
  updateNotificationPrefs,
} from "@/lib/auth-server";
import {
  getPushSubscriptions,
  getVapidPublicKey,
  isPushConfigured,
  removePushSubscription,
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
  const subscribed = subscriptions.some((item) => item.userId === user.id);

  return NextResponse.json({
    configured: isPushConfigured(),
    publicKey: getVapidPublicKey(),
    subscribed,
    preferences: user.notificationPrefs ?? {
      pushEnabled: true,
      devotions: true,
      messages: true,
      announcements: true,
      worship: true,
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
  const updated = await updateNotificationPrefs(user.id, { pushEnabled: false });

  return NextResponse.json({
    ok: true,
    user: updated ? toPublicMember(updated) : null,
  });
}
