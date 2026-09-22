import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { canManageAsAdmin } from "@/lib/admin-access-server";
import { getUserFromSession, SESSION_COOKIE } from "@/lib/auth-server";
import { sendPushToAllMembers } from "@/lib/push-server";
import { urgentAlertViewUrl } from "@/lib/share-urls";
import { syncUrgentAlertToCommunityNews } from "@/lib/urgent-alert-community-sync";
import {
  clearActiveUrgentAlert,
  getFlaggedUrgentAlert,
  getUrgentAlertById,
  listUrgentAlerts,
  listVisibleUrgentAlerts,
  saveUrgentAlert,
} from "@/lib/urgent-alert-server";

function revalidateUrgentAlertPages() {
  revalidatePath("/");
  revalidatePath("/community");
  revalidatePath("/admin/alerts");
  revalidatePath("/alerts", "layout");
}

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  const user = await getUserFromSession(token);

  if (!user || !(await canManageAsAdmin(user))) {
    return NextResponse.json({ error: "Admin access required." }, { status: 403 });
  }

  const [alerts, visible, flagged] = await Promise.all([
    listUrgentAlerts(),
    listVisibleUrgentAlerts(),
    getFlaggedUrgentAlert(),
  ]);
  return NextResponse.json({ alerts, active: visible[0] ?? null, visible, flagged });
}

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  const user = await getUserFromSession(token);

  if (!user || !(await canManageAsAdmin(user))) {
    return NextResponse.json({ error: "Admin access required." }, { status: 403 });
  }

  const body = await request.json();
  const action = String(body.action ?? "save");

  if (action === "clear") {
    await clearActiveUrgentAlert();
    revalidateUrgentAlertPages();
    return NextResponse.json({
      ok: true,
      active: null,
      flagged: null,
      visible: [],
    });
  }

  if (action === "deactivate") {
    const id = String(body.id ?? "").trim();
    if (!id) {
      return NextResponse.json({ error: "Alert id is required." }, { status: 400 });
    }
    const existing = await getUrgentAlertById(id);
    if (!existing) {
      return NextResponse.json({ error: "Alert not found." }, { status: 404 });
    }
    const alert = await saveUrgentAlert({
      ...existing,
      active: false,
      createdBy: existing.createdBy,
      createdByName: existing.createdByName,
    });
    await syncUrgentAlertToCommunityNews(alert);
    revalidateUrgentAlertPages();
    return NextResponse.json({
      alert,
      visible: await listVisibleUrgentAlerts(),
    });
  }

  const title = String(body.title ?? "").trim();
  const message = String(body.message ?? "").trim();
  if (!title || !message) {
    return NextResponse.json({ error: "Title and message are required." }, { status: 400 });
  }

  const startsAt = body.startsAt ? String(body.startsAt) : undefined;
  const expiresAt = body.expiresAt ? String(body.expiresAt) : undefined;
  if (startsAt && expiresAt && new Date(expiresAt) <= new Date(startsAt)) {
    return NextResponse.json(
      { error: "End date & time must be after the start date & time." },
      { status: 400 },
    );
  }

  const active = Boolean(body.active);
  const alert = await saveUrgentAlert({
    id: body.id ? String(body.id) : undefined,
    title,
    message,
    href: body.href ? String(body.href).trim() : undefined,
    ctaLabel: body.ctaLabel ? String(body.ctaLabel).trim() : undefined,
    imageUrl: body.imageUrl ? String(body.imageUrl).trim() : undefined,
    videoUrl: body.videoUrl ? String(body.videoUrl).trim() : undefined,
    artworkSquareUrl: body.artworkSquareUrl ? String(body.artworkSquareUrl).trim() : undefined,
    artworkWideUrl: body.artworkWideUrl ? String(body.artworkWideUrl).trim() : undefined,
    artworkBannerUrl: body.artworkBannerUrl ? String(body.artworkBannerUrl).trim() : undefined,
    active,
    startsAt,
    expiresAt,
    createdBy: user.id,
    createdByName: user.name,
  });

  await syncUrgentAlertToCommunityNews(alert);

  let notify: { sent: number; skipped: number; configured: boolean } | null = null;
  if (active && body.sendPush) {
    notify = await sendPushToAllMembers(
      {
        title: `URGENT: ${title}`,
        body: message.slice(0, 160),
        url: alert.href || urgentAlertViewUrl(alert.id),
      },
      "announcements",
      user.id,
    );
  }

  revalidateUrgentAlertPages();

  return NextResponse.json({
    alert,
    notify,
    visible: await listVisibleUrgentAlerts(),
  });
}
