import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getUserFromSession, SESSION_COOKIE } from "@/lib/auth-server";
import { isMarriageStage2Enabled } from "@/lib/marriage-stage2-feature";
import {
  acknowledgeSharedGoal,
  agreeActionPlan,
  buildStage2Dashboard,
  createActionPlan,
  createSharedGoal,
  getTemperamentInsightsForCouple,
  proposeActionPlan,
} from "@/lib/marriage-stage2-server";
import {
  listSharingConsentsForModule,
  setSharingConsent,
} from "@/lib/marriage-stage2-sharing-server";
import {
  getActivitySyncStatus,
  startActivitySyncSession,
} from "@/lib/marriage-stage2-sync-server";

export async function GET(request: Request) {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  const user = await getUserFromSession(token);
  if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  if (!isMarriageStage2Enabled()) {
    return NextResponse.json({ error: "Stage 2 is not enabled." }, { status: 404 });
  }

  const url = new URL(request.url);
  const view = url.searchParams.get("view");
  try {
    if (view === "temperament") {
      const scoringModel = url.searchParams.get("scoringModel");
      return NextResponse.json(await getTemperamentInsightsForCouple(user, { scoringModel }));
    }
    if (view === "sync") {
      const moduleId = url.searchParams.get("moduleId")?.trim();
      if (!moduleId) return NextResponse.json({ error: "moduleId required." }, { status: 400 });
      return NextResponse.json(await getActivitySyncStatus(user, moduleId));
    }
    if (view === "sharing_consents") {
      const journeyId = url.searchParams.get("journeyId")?.trim();
      const moduleId = url.searchParams.get("moduleId")?.trim();
      if (!journeyId || !moduleId) {
        return NextResponse.json({ error: "journeyId and moduleId required." }, { status: 400 });
      }
      return NextResponse.json(await listSharingConsentsForModule(user, journeyId, moduleId));
    }
    return NextResponse.json(await buildStage2Dashboard(user));
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unavailable." },
      { status: 400 },
    );
  }
}

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  const user = await getUserFromSession(token);
  if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  if (!isMarriageStage2Enabled()) {
    return NextResponse.json({ error: "Stage 2 is not enabled." }, { status: 404 });
  }

  const body = await request.json();
  const action = String(body.action ?? "");

  try {
    if (action === "create_action_plan") {
      return NextResponse.json({
        ok: true,
        plan: await createActionPlan(user, {
          title: String(body.title ?? ""),
          moduleId: body.moduleId ? String(body.moduleId) : undefined,
          items: Array.isArray(body.items) ? body.items : [],
        }),
      });
    }
    if (action === "propose_action_plan") {
      return NextResponse.json({
        ok: true,
        plan: await proposeActionPlan(user, String(body.planId ?? "")),
      });
    }
    if (action === "agree_action_plan") {
      return NextResponse.json({
        ok: true,
        plan: await agreeActionPlan(user, String(body.planId ?? "")),
      });
    }
    if (action === "create_goal") {
      return NextResponse.json({
        ok: true,
        goal: await createSharedGoal(user, {
          title: String(body.title ?? ""),
          description: body.description ? String(body.description) : undefined,
          category: body.category ?? "other",
          targetDate: body.targetDate ? String(body.targetDate) : undefined,
        }),
      });
    }
    if (action === "acknowledge_goal") {
      return NextResponse.json({
        ok: true,
        goal: await acknowledgeSharedGoal(user, String(body.goalId ?? "")),
      });
    }
    if (action === "set_sharing_consent") {
      return NextResponse.json({
        ok: true,
        consent: await setSharingConsent(user, {
          journeyId: String(body.journeyId ?? ""),
          moduleId: String(body.moduleId ?? ""),
          questionId: String(body.questionId ?? ""),
          granted: Boolean(body.granted),
        }),
      });
    }
    if (action === "start_sync") {
      return NextResponse.json({
        ok: true,
        session: await startActivitySyncSession(user, String(body.moduleId ?? "")),
      });
    }
    return NextResponse.json({ error: "Unknown action." }, { status: 400 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Request failed." },
      { status: 400 },
    );
  }
}
