import { NextResponse } from "next/server";
import { requireAskShepherdApiRequest } from "@/lib/ask-shepherd-route";
import { parseAskShepherdDepartmentKey } from "@/lib/ask-shepherd-departments";
import {
  assertNotAdminBypassingAskShepherd,
  resolveAskShepherdAccess,
} from "@/lib/ask-shepherd-access-server";
import { runAskShepherdChatTurn } from "@/lib/ask-shepherd-server";

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
    await assertNotAdminBypassingAskShepherd(user);
    const access = await resolveAskShepherdAccess(user, def);
    if (!access) {
      return NextResponse.json({ error: "Not authorized." }, { status: 403 });
    }

    const body = (await request.json().catch(() => ({}))) as {
      message?: unknown;
      category?: unknown;
      conversationId?: unknown;
      teamMemberUserId?: unknown;
    };

    const message = String(body.message ?? "").trim();
    const category = String(body.category ?? "general").trim() || "general";
    const conversationId =
      body.conversationId === null || body.conversationId === undefined || body.conversationId === ""
        ? null
        : String(body.conversationId).trim();
    const teamMemberUserId =
      body.teamMemberUserId === null ||
      body.teamMemberUserId === undefined ||
      body.teamMemberUserId === ""
        ? null
        : String(body.teamMemberUserId).trim();

    const result = await runAskShepherdChatTurn({
      user,
      department: def,
      conversationId,
      message,
      category,
      teamMemberUserId,
    });

    if (!result.ok) {
      return NextResponse.json(
        { error: result.error, retryAfterSeconds: result.retryAfterSeconds },
        { status: result.status },
      );
    }

    return NextResponse.json({
      ok: true,
      conversationId: result.conversationId,
      assistantMessage: result.assistantMessage,
      safeguarding: result.safeguarding,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Error";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
