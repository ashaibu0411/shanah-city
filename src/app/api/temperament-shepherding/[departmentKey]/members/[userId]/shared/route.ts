import { NextResponse } from "next/server";
import { requireTemperamentShepherdingRequest } from "@/lib/temperament-shepherding-feature-route";
import {
  assertNotAdminPeekingAtTemperament,
  getTemperamentShepherdingDepartmentAccess,
} from "@/lib/temperament-shepherding-access-server";
import { getDepartmentDef } from "@/lib/temperament-shepherding-departments";
import { appendTemperamentAudit, buildLeaderHighlightsForUser } from "@/lib/temperament-shepherding-server";
import { getGroups } from "@/lib/group-server";
import { isGroupMember } from "@/lib/group-admin-utils";

export async function GET(
  _request: Request,
  context: { params: Promise<{ departmentKey: string; userId: string }> },
) {
  const gate = await requireTemperamentShepherdingRequest();
  if ("error" in gate && gate.error) return gate.error;
  const viewer = gate.user!;

  const { departmentKey, userId: subjectUserId } = await context.params;
  const def = getDepartmentDef(departmentKey);
  if (!def?.pilotEnabled) {
    return NextResponse.json({ error: "Department not available." }, { status: 404 });
  }

  try {
    await assertNotAdminPeekingAtTemperament(viewer);
    const access = await getTemperamentShepherdingDepartmentAccess(viewer, def.key);
    if (!access?.canOpenLeaderDashboard) {
      return NextResponse.json({ error: "Not authorized." }, { status: 403 });
    }

    const groups = await getGroups();
    const group = groups.find((g) => g.id === def.groupId);
    if (!group || !isGroupMember(group, subjectUserId)) {
      return NextResponse.json({ error: "Member not in this department." }, { status: 404 });
    }

    const highlights = await buildLeaderHighlightsForUser({
      subjectUserId,
      departmentKey,
    });
    if (!highlights) {
      return NextResponse.json(
        { error: "No shared profile for this member, or assessment not completed." },
        { status: 404 },
      );
    }
    await appendTemperamentAudit({
      departmentKey,
      actorUserId: viewer.id,
      action: "view_shared_profile",
      targetUserId: subjectUserId,
      summary: `Viewed shared temperament summary for ${subjectUserId}`,
    });
    return NextResponse.json({ profile: highlights });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Error";
    return NextResponse.json({ error: msg }, { status: 403 });
  }
}
