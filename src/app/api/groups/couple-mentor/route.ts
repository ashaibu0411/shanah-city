import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getUserFromSession, SESSION_COOKIE } from "@/lib/auth-server";
import {
  closeMentorRequestForLeader,
  createMentorRequestForUser,
  getMentorPanelData,
  matchMentorRequestForLeader,
} from "@/lib/couple-mentor-server";

export async function GET(request: Request) {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  const user = await getUserFromSession(token);
  const groupId = new URL(request.url).searchParams.get("groupId")?.trim();

  if (!groupId) {
    return NextResponse.json({ error: "groupId is required." }, { status: 400 });
  }

  try {
    const data = await getMentorPanelData(groupId, user);
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not load mentor requests." },
      { status: 403 },
    );
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
  const groupId = String(body.groupId ?? "");
  const action = String(body.action ?? "request");

  try {
    if (action === "match") {
      const data = await matchMentorRequestForLeader(
        user,
        groupId,
        String(body.requestId ?? ""),
        String(body.mentorLinkId ?? ""),
      );
      return NextResponse.json(data);
    }

    if (action === "close") {
      const data = await closeMentorRequestForLeader(
        user,
        groupId,
        String(body.requestId ?? ""),
      );
      return NextResponse.json(data);
    }

    const data = await createMentorRequestForUser(
      user,
      groupId,
      body.note ? String(body.note) : undefined,
    );
    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not save mentor request." },
      { status: 400 },
    );
  }
}
