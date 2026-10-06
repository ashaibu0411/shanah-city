import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getUserFromSession, SESSION_COOKIE } from "@/lib/auth-server";
import {
  createMinistryHubPrayerPost,
  getMinistryHubForUser,
  saveMinistryHubAnnouncement,
} from "@/lib/group-ministry-hub-server";
import { groupHasMinistryHub } from "@/lib/group-ministry-hub-types";

export async function GET(request: Request) {
  const groupId = new URL(request.url).searchParams.get("groupId")?.trim() ?? "";
  if (!groupHasMinistryHub(groupId)) {
    return NextResponse.json({ error: "Hub not available for this group." }, { status: 404 });
  }

  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  const user = await getUserFromSession(token);

  try {
    const hub = await getMinistryHubForUser(user, groupId);
    return NextResponse.json(hub);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not load hub.";
    const status = message.includes("Sign in") ? 401 : 403;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  const user = await getUserFromSession(token);
  if (!user) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }

  const body = await request.json();
  const groupId = String(body.groupId ?? "").trim();
  const action = String(body.action ?? "prayer");

  if (!groupHasMinistryHub(groupId)) {
    return NextResponse.json({ error: "Hub not available for this group." }, { status: 404 });
  }

  try {
    if (action === "announcement") {
      const result = await saveMinistryHubAnnouncement(user, {
        groupId,
        title: String(body.title ?? ""),
        body: String(body.body ?? ""),
      });
      return NextResponse.json(result);
    }

    const result = await createMinistryHubPrayerPost(user, {
      groupId,
      content: String(body.content ?? ""),
      type: body.type === "praise" ? "praise" : "prayer",
    });
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not save." },
      { status: 400 },
    );
  }
}
