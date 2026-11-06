import { NextResponse } from "next/server";
import { requireTemperamentShepherdingRequest } from "@/lib/temperament-shepherding-feature-route";
import {
  assertNotAdminPeekingAtTemperament,
  getTemperamentShepherdingDepartmentAccess,
} from "@/lib/temperament-shepherding-access-server";
import { getDepartmentDef } from "@/lib/temperament-shepherding-departments";
import { appendTemperamentAudit, getMemberView, setLeaderShareConsent } from "@/lib/temperament-shepherding-server";

export async function PUT(
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
      shareWithLeader?: unknown;
      responseId?: unknown;
    };

    if (typeof body.shareWithLeader !== "boolean") {
      return NextResponse.json({ error: "shareWithLeader boolean required." }, { status: 400 });
    }
    const responseId = typeof body.responseId === "string" ? body.responseId.trim() : "";
    if (!responseId) {
      return NextResponse.json({ error: "responseId required." }, { status: 400 });
    }

    await setLeaderShareConsent({
      responseId,
      userId: user.id,
      departmentKey,
      share: body.shareWithLeader,
    });
    await appendTemperamentAudit({
      departmentKey,
      actorUserId: user.id,
      action: body.shareWithLeader ? "consent_leader_share" : "revoke_leader_share",
      targetUserId: user.id,
      summary: body.shareWithLeader ? "Consented to share profile summary with leaders" : "Withdrew leader sharing",
    });

    const view = await getMemberView({ userId: user.id, departmentKey, assessmentKind: "member" });
    const safe = {
      ...view,
      answers: {},
      snapshot: view.snapshot
        ? {
            disclaimer: view.snapshot.disclaimer,
            highlightsJson: view.snapshot.highlightsJson,
          }
        : null,
    };
    return NextResponse.json({ ok: true, view: safe });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Error";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
