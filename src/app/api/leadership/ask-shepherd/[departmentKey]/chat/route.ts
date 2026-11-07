import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { requireAskShepherdApiRequest } from "@/lib/ask-shepherd-route";
import { parseAskShepherdDepartmentKey } from "@/lib/ask-shepherd-departments";
import {
  assertNotAdminBypassingAskShepherd,
  resolveAskShepherdAccess,
} from "@/lib/ask-shepherd-access-server";
import { runAskShepherdChatTurn } from "@/lib/ask-shepherd-server";
import {
  ASK_SHEPHERD_EPHEMERAL_PRIVACY_COOKIE,
  appendEphemeralTurnReceipt,
  ephemeralTeamContextLockedFromPayload,
  isAskShepherdEphemeralPrivacyConfigured,
  parseEphemeralPrivacyCookie,
  setEphemeralPrivacyCookieOnResponse,
  validateEphemeralHistoryAgainstCookie,
  validateEphemeralPrivacyBinding,
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
      message?: unknown;
      category?: unknown;
      conversationId?: unknown;
      teamMemberUserId?: unknown;
      ephemeralHistory?: unknown;
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

    const ephemeralHistory = Array.isArray(body.ephemeralHistory)
      ? body.ephemeralHistory
          .map((row: { role?: unknown; content?: unknown }) => ({
            role: row.role === "assistant" ? ("assistant" as const) : row.role === "user" ? ("user" as const) : null,
            content: String(row.content ?? ""),
          }))
          .filter((row): row is { role: "user" | "assistant"; content: string } => row.role !== null)
      : [];

    const ephemeralTurn = conversationId === null || conversationId === "";

    const cookieStore = await cookies();
    const existingPrivacyCookie = cookieStore.get(ASK_SHEPHERD_EPHEMERAL_PRIVACY_COOKIE)?.value;

    if (ephemeralTurn) {
      const histCheck = validateEphemeralHistoryAgainstCookie({
        cookieRaw: existingPrivacyCookie,
        userId: user.id,
        departmentKey: def.key,
        ephemeralHistory,
      });
      if (!histCheck.ok) {
        const msg =
          histCheck.clientErrorCode === "privacy_verification_unconfigured" ?
            "Server configuration prevents verifying privacy rules."
          : histCheck.clientErrorCode === "ephemeral_history_malformed" ? "Invalid chat history format."
          : "Chat session changed. Start a new chat before continuing.";
        return NextResponse.json(
          { error: msg, clientErrorCode: histCheck.clientErrorCode },
          { status: histCheck.status },
        );
      }
    }

    const result = await runAskShepherdChatTurn({
      user,
      department: def,
      conversationId,
      message,
      category,
      teamMemberUserId,
      ephemeralHistory,
    });

    const usedThisTurn = "ephemeralUsedTeamContext" in result && result.ephemeralUsedTeamContext === true;

    let newPrivacyCookie: string | null = null;
    if (ephemeralTurn && result.ok && isAskShepherdEphemeralPrivacyConfigured()) {
      try {
        newPrivacyCookie = appendEphemeralTurnReceipt({
          existingRaw: existingPrivacyCookie,
          userId: user.id,
          departmentKey: def.key,
          userMessage: message,
          assistantMessage: result.assistantMessage,
          teamContextThisTurn: usedThisTurn,
          kind: result.usedStaticSafeguarding ? "crit" : "ai",
        });
      } catch {
        newPrivacyCookie = null;
      }
    }

    let ephemeralTeamContextLocked = false;
    if (ephemeralTurn) {
      const raw = newPrivacyCookie ?? existingPrivacyCookie;
      const bound = validateEphemeralPrivacyBinding(
        parseEphemeralPrivacyCookie(raw),
        user.id,
        def.key,
      );
      ephemeralTeamContextLocked = bound.ok && ephemeralTeamContextLockedFromPayload(bound.payload);
    }

    const buildJson = () => {
      if (!result.ok) {
        return {
          error: result.error,
          retryAfterSeconds: result.retryAfterSeconds,
          clientErrorCode: result.clientErrorCode,
          ...(ephemeralTurn ? { ephemeralTeamContextLocked } : {}),
        };
      }
      return {
        ok: true,
        conversationId: result.conversationId,
        assistantMessage: result.assistantMessage,
        safeguarding: result.safeguarding,
        usedStaticSafeguarding: result.usedStaticSafeguarding ?? false,
        ...(ephemeralTurn ? { ephemeralTeamContextLocked } : {}),
      };
    };

    if (!ephemeralTurn) {
      return NextResponse.json(buildJson(), { status: result.ok ? 200 : result.status });
    }

    const res = NextResponse.json(buildJson(), { status: result.ok ? 200 : result.status });
    if (newPrivacyCookie !== null) {
      setEphemeralPrivacyCookieOnResponse(res, newPrivacyCookie);
    }
    return res;
  } catch {
    return NextResponse.json({ error: "Request could not be completed." }, { status: 400 });
  }
}
