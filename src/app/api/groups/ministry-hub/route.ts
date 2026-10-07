import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getUserFromSession, SESSION_COOKIE } from "@/lib/auth-server";
import {
  getMinistryHubForUser,
  saveMinistryHubAnnouncement,
} from "@/lib/group-ministry-hub-server";
import {
  broadcastMinistryHubMessage,
  checkInMinistryHubFaithChallenge,
  getMinistryHubProgramForUser,
  saveMinistryHubBiblePlan,
  saveMinistryHubBibleStudy,
  saveMinistryHubFaithChallenge,
  updateMinistryHubPlanProgress,
} from "@/lib/group-ministry-hub-program-server";
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
    const [hub, program] = await Promise.all([
      getMinistryHubForUser(user, groupId),
      user ? getMinistryHubProgramForUser(user, groupId) : null,
    ]);
    return NextResponse.json({ ...hub, ...program });
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
  const action = String(body.action ?? "announcement").trim();
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

    if (action === "bibleStudy") {
      const bibleStudy = await saveMinistryHubBibleStudy(user, {
        groupId,
        leaderUserId: body.leaderUserId ? String(body.leaderUserId) : undefined,
        leaderName: String(body.leaderName ?? ""),
        topic: String(body.topic ?? ""),
        bibleBook: String(body.bibleBook ?? ""),
        meetingTime: body.meetingTime ? String(body.meetingTime) : undefined,
        reminder1Hour: body.reminder1Hour !== undefined ? Number(body.reminder1Hour) : undefined,
        reminder1Minute:
          body.reminder1Minute !== undefined ? Number(body.reminder1Minute) : undefined,
        reminder2Hour: body.reminder2Hour !== undefined ? Number(body.reminder2Hour) : undefined,
        reminder2Minute:
          body.reminder2Minute !== undefined ? Number(body.reminder2Minute) : undefined,
      });
      const program = await getMinistryHubProgramForUser(user, groupId);
      return NextResponse.json({ ...program, bibleStudy });
    }

    if (action === "broadcast") {
      const result = await broadcastMinistryHubMessage(user, {
        groupId,
        title: String(body.title ?? ""),
        body: String(body.body ?? ""),
      });
      return NextResponse.json(result);
    }

    if (action === "biblePlan") {
      const biblePlan = await saveMinistryHubBiblePlan(user, {
        groupId,
        title: String(body.title ?? ""),
        days: body.days,
      });
      const program = await getMinistryHubProgramForUser(user, groupId);
      return NextResponse.json({ ...program, biblePlan, planProgress: [] });
    }

    if (action === "planProgress") {
      const progress = await updateMinistryHubPlanProgress(user, {
        groupId,
        planId: String(body.planId ?? ""),
        dayIndex: Number(body.dayIndex),
        completed: Boolean(body.completed),
      });
      return NextResponse.json(progress);
    }

    if (action === "faithChallenge") {
      const faithChallenge = await saveMinistryHubFaithChallenge(user, {
        groupId,
        title: String(body.title ?? ""),
        body: String(body.body ?? ""),
        weekStart: body.weekStart ? String(body.weekStart) : undefined,
      });
      const program = await getMinistryHubProgramForUser(user, groupId);
      return NextResponse.json({ ...program, faithChallenge, challengeCheckedIn: false });
    }

    if (action === "challengeCheckIn") {
      const result = await checkInMinistryHubFaithChallenge(user, {
        groupId,
        challengeId: String(body.challengeId ?? ""),
      });
      const program = await getMinistryHubProgramForUser(user, groupId);
      return NextResponse.json({ ...program, ...result, challengeCheckedIn: true });
    }

    return NextResponse.json({ error: "Unknown action." }, { status: 400 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not save." },
      { status: 400 },
    );
  }
}
