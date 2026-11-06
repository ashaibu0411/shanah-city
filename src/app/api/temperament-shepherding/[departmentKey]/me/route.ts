import { NextResponse } from "next/server";
import { requireTemperamentShepherdingRequest } from "@/lib/temperament-shepherding-feature-route";
import {
  assertNotAdminPeekingAtTemperament,
  getTemperamentShepherdingDepartmentAccess,
} from "@/lib/temperament-shepherding-access-server";
import { getDepartmentDef } from "@/lib/temperament-shepherding-departments";
import {
  appendTemperamentAudit,
  getMemberView,
  saveDraft,
  submitAssessment,
  serializeTemperamentSelfView,
} from "@/lib/temperament-shepherding-server";
import { TEMPERAMENT_SHEPHERDING_CONTENT_VERSION } from "@/lib/temperament-shepherding-content";
import { questionsForKind } from "@/lib/temperament-shepherding-content";
import type { TemperamentAssessmentKind } from "@/lib/temperament-shepherding-types";
import type { TemperamentAnswersMap } from "@/lib/temperament-shepherding-types";

function parseKind(v: unknown): TemperamentAssessmentKind | null {
  if (v === "member" || v === "leader") return v;
  return null;
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ departmentKey: string }> },
) {
  const gate = await requireTemperamentShepherdingRequest();
  if ("error" in gate && gate.error) return gate.error;
  const user = gate.user!;

  const { departmentKey } = await context.params;
  const def = getDepartmentDef(departmentKey);
  if (!def?.pilotEnabled) {
    return NextResponse.json({ error: "Department not available." }, { status: 404 });
  }

  try {
    await assertNotAdminPeekingAtTemperament(user);
    const access = await getTemperamentShepherdingDepartmentAccess(user, def.key);
    if (!access?.canUseHub) {
      return NextResponse.json({ error: "Not authorized for this hub." }, { status: 403 });
    }

    const [member, leader] = await Promise.all([
      getMemberView({ userId: user.id, departmentKey, assessmentKind: "member" }),
      getMemberView({ userId: user.id, departmentKey, assessmentKind: "leader" }),
    ]);

    const safeMember = serializeTemperamentSelfView(member, "member");
    const safeLeader = serializeTemperamentSelfView(leader, "leader");

    return NextResponse.json({
      departmentKey,
      contentVersion: TEMPERAMENT_SHEPHERDING_CONTENT_VERSION,
      questions: {
        member: questionsForKind("member"),
        leader: questionsForKind("leader"),
      },
      access,
      member: safeMember,
      leader: safeLeader,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Error";
    return NextResponse.json({ error: msg }, { status: 403 });
  }
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ departmentKey: string }> },
) {
  const gate = await requireTemperamentShepherdingRequest();
  if ("error" in gate && gate.error) return gate.error;
  const user = gate.user!;

  const { departmentKey } = await context.params;
  const def = getDepartmentDef(departmentKey);
  if (!def?.pilotEnabled) {
    return NextResponse.json({ error: "Department not available." }, { status: 404 });
  }

  try {
    await assertNotAdminPeekingAtTemperament(user);
    const access = await getTemperamentShepherdingDepartmentAccess(user, def.key);
    if (!access?.canUseHub) {
      return NextResponse.json({ error: "Not authorized." }, { status: 403 });
    }

    const body = (await request.json().catch(() => ({}))) as {
      assessmentKind?: unknown;
      answers?: unknown;
    };
    const kind = parseKind(body.assessmentKind);
    if (!kind) {
      return NextResponse.json({ error: "assessmentKind must be member or leader." }, { status: 400 });
    }
    if (kind === "leader" && !access.canCompleteLeaderAssessment) {
      return NextResponse.json({ error: "Not authorized for leader assessment." }, { status: 403 });
    }

    const answers = (body.answers ?? {}) as TemperamentAnswersMap;
    await saveDraft({
      userId: user.id,
      departmentKey,
      assessmentKind: kind,
      answers,
    });
    await appendTemperamentAudit({
      departmentKey,
      actorUserId: user.id,
      action: "draft_saved",
      targetUserId: user.id,
      summary: `Draft saved (${kind})`,
      meta: { assessmentKind: kind },
    });

    const view = await getMemberView({ userId: user.id, departmentKey, assessmentKind: kind });
    const safe = serializeTemperamentSelfView(view, kind);

    return NextResponse.json({ ok: true, view: safe });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Error";
    const status = msg.includes("already submitted") ? 409 : 400;
    return NextResponse.json({ error: msg }, { status });
  }
}

export async function POST(
  request: Request,
  context: { params: Promise<{ departmentKey: string }> },
) {
  const gate = await requireTemperamentShepherdingRequest();
  if ("error" in gate && gate.error) return gate.error;
  const user = gate.user!;

  const { departmentKey } = await context.params;
  const def = getDepartmentDef(departmentKey);
  if (!def?.pilotEnabled) {
    return NextResponse.json({ error: "Department not available." }, { status: 404 });
  }

  try {
    await assertNotAdminPeekingAtTemperament(user);
    const access = await getTemperamentShepherdingDepartmentAccess(user, def.key);
    if (!access?.canUseHub) {
      return NextResponse.json({ error: "Not authorized." }, { status: 403 });
    }

    const body = (await request.json().catch(() => ({}))) as {
      action?: unknown;
      assessmentKind?: unknown;
      answers?: unknown;
      dataUseConsent?: unknown;
    };

    if (body.action !== "submit") {
      return NextResponse.json({ error: "Unsupported action." }, { status: 400 });
    }

    const kind = parseKind(body.assessmentKind);
    if (!kind) {
      return NextResponse.json({ error: "assessmentKind must be member or leader." }, { status: 400 });
    }
    if (kind === "leader" && !access.canCompleteLeaderAssessment) {
      return NextResponse.json({ error: "Not authorized for leader assessment." }, { status: 403 });
    }
    if (body.dataUseConsent !== true) {
      return NextResponse.json({ error: "dataUseConsent must be true to submit." }, { status: 400 });
    }

    const answers = (body.answers ?? {}) as TemperamentAnswersMap;
    await submitAssessment({
      userId: user.id,
      departmentKey,
      assessmentKind: kind,
      answers,
      dataUseConsentAt: new Date(),
    });
    await appendTemperamentAudit({
      departmentKey,
      actorUserId: user.id,
      action: "submitted",
      targetUserId: user.id,
      summary: `Assessment submitted (${kind})`,
      meta: { assessmentKind: kind },
    });

    const view = await getMemberView({ userId: user.id, departmentKey, assessmentKind: kind });
    const safe = serializeTemperamentSelfView(view, kind);
    return NextResponse.json({
      ok: true,
      view: safe,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Error";
    const status =
      msg === "Already submitted."
        ? 409
        : msg.includes("Please answer") || msg.includes("Answers must") || msg.includes("Unknown question")
          ? 400
          : 400;
    return NextResponse.json({ error: msg }, { status });
  }
}
