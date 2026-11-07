import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { requireAskShepherdApiRequest } from "@/lib/ask-shepherd-route";
import { parseAskShepherdDepartmentKey } from "@/lib/ask-shepherd-departments";
import {
  assertNotAdminBypassingAskShepherd,
  resolveAskShepherdAccess,
} from "@/lib/ask-shepherd-access-server";
import { saveEphemeralConversationToLibrary } from "@/lib/ask-shepherd-server";
import {
  ASK_SHEPHERD_EPHEMERAL_PRIVACY_COOKIE,
  validateEphemeralSaveMessages,
} from "@/lib/ask-shepherd-ephemeral-privacy-cookie";

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
    };

    const title = String(body.title ?? "Saved guidance").trim() || "Saved guidance";
    const category = String(body.category ?? "general").trim() || "general";
    const rawMessages = Array.isArray(body.messages) ? body.messages : [];

    const messages = rawMessages
      .map((m: { role?: unknown; content?: unknown }) => ({
        role: m.role === "assistant" ? ("assistant" as const) : m.role === "user" ? ("user" as const) : null,
        content: String(m.content ?? ""),
      }))
      .filter((m): m is { role: "user" | "assistant"; content: string } => m.role !== null);

    const cookieStore = await cookies();
    const cookieRaw = cookieStore.get(ASK_SHEPHERD_EPHEMERAL_PRIVACY_COOKIE)?.value;

    const v = validateEphemeralSaveMessages({
      cookieRaw,
      userId: user.id,
      departmentKey: def.key,
      messages,
    });
    if (!v.ok) {
      const err =
        v.clientErrorCode === "privacy_verification_unconfigured" ?
          "Server configuration prevents verifying privacy rules. Saving is temporarily unavailable."
        : v.clientErrorCode === "nothing_to_save" ? "Nothing to save."
        : "Request could not be completed.";
      return NextResponse.json(
        {
          error: err,
          clientErrorCode: v.clientErrorCode,
          ...(v.clientErrorCode === "privacy_verification_unconfigured" ?
            { code: "privacy_verification_unconfigured" }
          : {}),
        },
        { status: v.status },
      );
    }

    const result = await saveEphemeralConversationToLibrary({
      user,
      department: def,
      title,
      category,
      messages,
    });

    return NextResponse.json({ ok: true, conversationId: result.conversationId });
  } catch (e) {
    if (e instanceof Error && e.message === "Nothing to save.") {
      return NextResponse.json({ error: "Nothing to save." }, { status: 400 });
    }
    return NextResponse.json({ error: "Request could not be completed." }, { status: 400 });
  }
}
