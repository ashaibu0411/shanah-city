import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getUserFromSession, SESSION_COOKIE } from "@/lib/auth-server";
import { SHANAH_WORSHIP_GROUP_ID } from "@/lib/choir-group-constants";
import {
  buildChoirAnnouncementsPagePayload,
  createChoirAnnouncement,
  deleteChoirAnnouncement,
} from "@/lib/choir-announcements-server";

export async function GET(request: Request) {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  const user = await getUserFromSession(token);

  if (!user) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }

  const groupId =
    new URL(request.url).searchParams.get("groupId")?.trim() ?? SHANAH_WORSHIP_GROUP_ID;
  const payload = await buildChoirAnnouncementsPagePayload(user, groupId);
  if (!payload) {
    return NextResponse.json({ error: "Access denied." }, { status: 403 });
  }

  return NextResponse.json({ payload });
}

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  const user = await getUserFromSession(token);

  if (!user) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }

  const body = await request.json();
  const groupId = String(body.groupId ?? SHANAH_WORSHIP_GROUP_ID).trim();
  const action = String(body.action ?? "create");

  if (groupId !== SHANAH_WORSHIP_GROUP_ID) {
    return NextResponse.json({ error: "Invalid group." }, { status: 400 });
  }

  if (action === "delete") {
    const id = String(body.id ?? "").trim();
    const result = await deleteChoirAnnouncement(user, groupId, id);
    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: result.error.includes("not found") ? 404 : 403 });
    }
    return NextResponse.json({ ok: true });
  }

  const result = await createChoirAnnouncement(user, groupId, {
    title: String(body.title ?? ""),
    body: String(body.body ?? ""),
  });
  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({ announcement: result.announcement });
}
