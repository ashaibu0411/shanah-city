import { NextResponse } from "next/server";
import { requireTemperamentShepherdingRequest } from "@/lib/temperament-shepherding-feature-route";
import {
  assertNotAdminPeekingAtTemperament,
  getTemperamentShepherdingDepartmentAccess,
} from "@/lib/temperament-shepherding-access-server";
import { getDepartmentDef } from "@/lib/temperament-shepherding-departments";
import { appendTemperamentAudit, buildLeaderDashboard } from "@/lib/temperament-shepherding-server";

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
    if (!access?.canOpenLeaderDashboard) {
      return NextResponse.json({ error: "Not authorized for leader dashboard." }, { status: 403 });
    }

    const dash = await buildLeaderDashboard({ departmentKey });
    await appendTemperamentAudit({
      departmentKey,
      actorUserId: user.id,
      action: "leader_dashboard_view",
      summary: "Opened shepherding dashboard",
    });
    return NextResponse.json(dash);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Error";
    return NextResponse.json({ error: msg }, { status: 403 });
  }
}
