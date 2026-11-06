import { NextResponse } from "next/server";
import { requireAskShepherdApiRequest } from "@/lib/ask-shepherd-route";
import { parseAskShepherdDepartmentKey } from "@/lib/ask-shepherd-departments";
import {
  assertNotAdminBypassingAskShepherd,
  resolveAskShepherdAccess,
} from "@/lib/ask-shepherd-access-server";
import { saveEphemeralConversationToLibrary } from "@/lib/ask-shepherd-server";

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
      title?: unknown;
      category?: unknown;
      messages?: unknown;
      hadTeamContextInSession?: unknown;
    };

    const title = String(body.title ?? "Saved guidance").trim() || "Saved guidance";
    const category = String(body.category ?? "general").trim() || "general";
    const hadTeamContextInSession = body.hadTeamContextInSession === true;
    const rawMessages = Array.isArray(body.messages) ? body.messages : [];

    const messages = rawMessages
      .map((m: { role?: unknown; content?: unknown }) => ({
        role: m.role === "assistant" ? ("assistant" as const) : m.role === "user" ? ("user" as const) : null,
        content: String(m.content ?? ""),
      }))
      .filter((m): m is { role: "user" | "assistant"; content: string } => m.role !== null);

    const result = await saveEphemeralConversationToLibrary({
      user,
      department: def,
      title,
      category,
      messages,
      hadTeamContextInSession,
    });

    return NextResponse.json({ ok: true, conversationId: result.conversationId });
  } catch (e) {
    if (e instanceof Error && e.message === "Nothing to save.") {
      return NextResponse.json({ error: "Nothing to save." }, { status: 400 });
    }
    if (
      e instanceof Error &&
      e.message.startsWith("Cannot save a session that used consented team context")
    ) {
      return NextResponse.json(
        { error: "Request could not be completed.", clientErrorCode: "team_context_save_blocked" },
        { status: 400 },
      );
    }
    return NextResponse.json({ error: "Request could not be completed." }, { status: 400 });
  }
}
