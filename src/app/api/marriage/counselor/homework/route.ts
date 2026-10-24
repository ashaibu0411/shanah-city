import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getUserFromSession, SESSION_COOKIE } from "@/lib/auth-server";
import {
  counselorRouteErrorBody,
  counselorRouteErrorStatus,
} from "@/lib/marriage-counselor-api-security";
import {
  createSessionHomeworkDraft,
  listCounselorHomeworkForJourney,
  listHomeworkTemplatesForCounselor,
} from "@/lib/marriage-homework-server";
import type { MarriageHomeworkActivityDef } from "@/lib/marriage-homework-types";

export async function GET(request: Request) {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  const user = await getUserFromSession(token);
  if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });

  const url = new URL(request.url);
  const journeyId = url.searchParams.get("journeyId")?.trim();
  if (!journeyId) {
    return NextResponse.json({
      templates: listHomeworkTemplatesForCounselor(),
    });
  }
  try {
    const items = await listCounselorHomeworkForJourney(user, journeyId);
    return NextResponse.json({ items }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Request failed.";
    return NextResponse.json(counselorRouteErrorBody(message), {
      status: counselorRouteErrorStatus(message),
    });
  }
}

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  const user = await getUserFromSession(token);
  if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });

  const body = await request.json();
  try {
    const homework = await createSessionHomeworkDraft(user, {
      journeyId: String(body.journeyId ?? ""),
      templateKey: body.templateKey ? String(body.templateKey) : undefined,
      title: body.title ? String(body.title) : undefined,
      instructions: body.instructions ? String(body.instructions) : undefined,
      sessionId: body.sessionId ? String(body.sessionId) : undefined,
      activities: Array.isArray(body.activities)
        ? (body.activities as MarriageHomeworkActivityDef[])
        : undefined,
    });
    return NextResponse.json({ ok: true, homework });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Request failed.";
    return NextResponse.json(counselorRouteErrorBody(message), {
      status: counselorRouteErrorStatus(message),
    });
  }
}
