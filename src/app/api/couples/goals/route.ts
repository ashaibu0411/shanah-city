import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getUserFromSession, SESSION_COOKIE } from "@/lib/auth-server";
import {
  createCoupleMarriageGoalForUser,
  deleteCoupleMarriageGoalForUser,
  getCoupleMarriageGoalsForUser,
  toggleCoupleMarriageGoalMilestoneForUser,
  updateCoupleMarriageGoalForUser,
} from "@/lib/couple-marriage-goal-server";

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  const user = await getUserFromSession(token);
  if (!user) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }

  try {
    const data = await getCoupleMarriageGoalsForUser(user);
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not load goals." },
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
  const action = String(body.action ?? "create");

  try {
    if (action === "create") {
      const result = await createCoupleMarriageGoalForUser(user, body);
      return NextResponse.json(result, { status: 201 });
    }

    const goalId = String(body.goalId ?? "");

    if (action === "update") {
      const result = await updateCoupleMarriageGoalForUser(user, goalId, body);
      return NextResponse.json(result);
    }

    if (action === "delete") {
      const result = await deleteCoupleMarriageGoalForUser(user, goalId);
      return NextResponse.json(result);
    }

    if (action === "toggleMilestone") {
      const milestoneId = String(body.milestoneId ?? "");
      const result = await toggleCoupleMarriageGoalMilestoneForUser(user, goalId, milestoneId);
      return NextResponse.json(result);
    }

    return NextResponse.json({ error: "Unknown action." }, { status: 400 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Something went wrong." },
      { status: 400 },
    );
  }
}
