import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { requireAskShepherdApiRequest } from "@/lib/ask-shepherd-route";
import { parseAskShepherdDepartmentKey } from "@/lib/ask-shepherd-departments";
import { assertNotAdminBypassingAskShepherd } from "@/lib/ask-shepherd-access-server";
import { getPastoralRoleAssignments } from "@/lib/pastoral-roles-server";
import { prisma } from "@/lib/db";
import { appendAskShepherdAudit } from "@/lib/ask-shepherd-server";
import { useDatabase } from "@/lib/use-database";

export async function POST(
  request: Request,
  context: { params: Promise<{ departmentKey: string }> },
) {
  const gate = await requireAskShepherdApiRequest();
  if ("error" in gate && gate.error) return gate.error;
  const user = gate.user!;

  const { departmentKey } = await context.params;
  const def = parseAskShepherdDepartmentKey(departmentKey);
  if (!def) {
    return NextResponse.json({ error: "Department not available." }, { status: 404 });
  }

  try {
    if (!useDatabase()) {
      return NextResponse.json({ error: "Ask Shepherd requires a database." }, { status: 503 });
    }
    await assertNotAdminBypassingAskShepherd(user);
    const assignments = await getPastoralRoleAssignments();
    const isPastor =
      assignments.seniorPastorUserId === user.id || assignments.associatePastorUserId === user.id;
    if (!isPastor) {
      return NextResponse.json({ error: "Only assigned pastors can manage access grants." }, { status: 403 });
    }

    const body = (await request.json().catch(() => ({}))) as {
      userId?: unknown;
      revoke?: unknown;
      note?: unknown;
    };
    const targetUserId = String(body.userId ?? "").trim();
    if (!targetUserId) {
      return NextResponse.json({ error: "userId required." }, { status: 400 });
    }

    if (body.revoke === true) {
      await prisma.askShepherdAccessGrant.updateMany({
        where: { userId: targetUserId, departmentKey: def.key, revokedAt: null },
        data: { revokedAt: new Date() },
      });
      await appendAskShepherdAudit({
        departmentKey: def.key,
        actorUserId: user.id,
        action: "access_grant_revoked",
        targetUserId,
        summary: "Ask Shepherd access grant revoked",
      });
      return NextResponse.json({ ok: true, revoked: true });
    }

    await prisma.askShepherdAccessGrant.create({
      data: {
        id: randomUUID(),
        userId: targetUserId,
        departmentKey: def.key,
        grantedByUserId: user.id,
        note: typeof body.note === "string" ? body.note.slice(0, 500) : null,
      },
    });
    await appendAskShepherdAudit({
      departmentKey: def.key,
      actorUserId: user.id,
      action: "access_grant_created",
      targetUserId,
      summary: "Ask Shepherd access grant created",
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Error";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
