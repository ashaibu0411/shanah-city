import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getUserFromSession, SESSION_COOKIE } from "@/lib/auth-server";
import {
  acceptSurpriseDateForUser,
  createDateNightPlanForUser,
  deleteDateNightPlanForUser,
  getDateNightHubForUser,
  updateDateNightPlanForUser,
} from "@/lib/couple-date-night-server";

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  const user = await getUserFromSession(token);
  if (!user) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }

  try {
    const hub = await getDateNightHubForUser(user);
    return NextResponse.json(hub);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not load date night planner." },
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
      const result = await createDateNightPlanForUser(user, body);
      return NextResponse.json(result, { status: 201 });
    }

    if (action === "update") {
      const planId = String(body.planId ?? "");
      const result = await updateDateNightPlanForUser(user, planId, body);
      return NextResponse.json(result);
    }

    if (action === "acceptSurprise") {
      const planId = String(body.planId ?? "");
      const result = await acceptSurpriseDateForUser(user, planId);
      return NextResponse.json(result);
    }

    if (action === "delete") {
      const planId = String(body.planId ?? "");
      const result = await deleteDateNightPlanForUser(user, planId);
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
