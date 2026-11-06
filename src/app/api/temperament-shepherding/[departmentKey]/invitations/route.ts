import { NextResponse } from "next/server";
import { requireTemperamentShepherdingRequest } from "@/lib/temperament-shepherding-feature-route";
import {
  assertNotAdminPeekingAtTemperament,
  getTemperamentShepherdingDepartmentAccess,
} from "@/lib/temperament-shepherding-access-server";
import { getDepartmentDef } from "@/lib/temperament-shepherding-departments";
import { getGroups } from "@/lib/group-server";
import { isGroupMember } from "@/lib/group-admin-utils";
import { appendTemperamentAudit, upsertInvitation } from "@/lib/temperament-shepherding-server";
import { sendPushToUsers } from "@/lib/push-server";

async function canManageInvites(
  userId: string,
  def: NonNullable<ReturnType<typeof getDepartmentDef>>,
  access: Awaited<ReturnType<typeof getTemperamentShepherdingDepartmentAccess>>,
) {
  if (!access?.canOpenLeaderDashboard) return false;
  if (access.hasPastoralOversight) return true;
  const groups = await getGroups();
  const group = groups.find((g) => g.id === def.groupId);
  return Boolean(group && isGroupMember(group, userId));
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
    if (!(await canManageInvites(user.id, def, access))) {
      return NextResponse.json({ error: "Not authorized to manage invitations." }, { status: 403 });
    }

    const body = (await request.json().catch(() => ({}))) as {
      inviteeUserId?: unknown;
      notify?: unknown;
    };
    const inviteeUserId = typeof body.inviteeUserId === "string" ? body.inviteeUserId.trim() : "";
    if (!inviteeUserId) {
      return NextResponse.json({ error: "inviteeUserId required." }, { status: 400 });
    }

    const groups = await getGroups();
    const group = groups.find((g) => g.id === def.groupId);
    if (!group || !isGroupMember(group, inviteeUserId)) {
      return NextResponse.json({ error: "Invitee must be in this ministry group." }, { status: 400 });
    }

    const row = await upsertInvitation({
      departmentKey,
      inviterUserId: user.id,
      inviteeUserId,
      status: "pending",
    });
    await appendTemperamentAudit({
      departmentKey,
      actorUserId: user.id,
      action: "invitation_sent",
      targetUserId: inviteeUserId,
      summary: "Temperament assessment invitation recorded",
    });

    const shouldNotify =
      body.notify === true &&
      process.env.NODE_ENV === "production" &&
      process.env.TEMPERAMENT_SHEPHERDING_SEND_INVITE_PUSH === "1";

    if (shouldNotify) {
      await sendPushToUsers(
        [inviteeUserId],
        {
          title: "Shanah Worship — optional temperament reflection",
          body: "Your worship leaders invited you to a private temperament & teamwork reflection (optional).",
          url: `/worship/shepherding?department=${encodeURIComponent(departmentKey)}`,
        },
        "worship",
      );
    }

    return NextResponse.json({
      ok: true,
      invitation: row,
      notifySent: shouldNotify,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Error";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
