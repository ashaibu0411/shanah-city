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
  ASK_SHEPHERD_TEAM_CTX_COOKIE,
  cookieValueIndicatesTeamContextUsed,
  fingerprintAskShepherdTranscript,
  parseEphemeralTeamContextCookie,
  isAskShepherdTeamContextCookieConfigured,
  mergeEphemeralTeamContextCookie,
  setTeamContextCookieOnResponse,
} from "@/lib/ask-shepherd-team-context-cookie";

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

    // A client can clear its cookie but cannot manufacture a signed receipt
    // matching a prior response. Validate the full supplied history before AI.
    const ephemeralTurn = conversationId === null || conversationId === "";
    const cookieStore = await cookies();
    const existingTeamCookie = cookieStore.get(ASK_SHEPHERD_TEAM_CTX_COOKIE)?.value;
    const priorReceipt = parseEphemeralTeamContextCookie(existingTeamCookie, user.id, def.key);
    if (ephemeralTurn && ephemeralHistory.length > 0) {
      if (
        !priorReceipt.ok ||
        priorReceipt.transcriptHash !== fingerprintAskShepherdTranscript(ephemeralHistory)
      ) {
        return NextResponse.json(
          { error: "Chat session changed. Start a new chat before continuing.", clientErrorCode: "ephemeral_session_mismatch" },
          { status: 409 },
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

    const usedThisTurn =
      ("ephemeralUsedTeamContext" in result && result.ephemeralUsedTeamContext === true) ||
      (result.ok && result.safeguarding === "critical");

    let mergedTeamCookie: string | null = null;
    if (ephemeralTurn && isAskShepherdTeamContextCookieConfigured()) {
      try {
        const transcript = result.ok
          ? [
              ...ephemeralHistory,
              { role: "user" as const, content: message },
              { role: "assistant" as const, content: result.assistantMessage },
            ]
          : ephemeralHistory;
        mergedTeamCookie = mergeEphemeralTeamContextCookie({
          // Empty history starts a new chat; a prior receipt must not taint it.
          existingRaw: ephemeralHistory.length > 0 ? existingTeamCookie : undefined,
          userId: user.id,
          departmentKey: def.key,
          thisTurnUsedConsentedTeamContext: usedThisTurn,
          transcriptHash: fingerprintAskShepherdTranscript(transcript),
        });
      } catch {
        mergedTeamCookie = null;
      }
    }

    const ephemeralLocked =
      mergedTeamCookie !== null && cookieValueIndicatesTeamContextUsed(mergedTeamCookie, user.id, def.key);

    const buildJson = () => {
      if (!result.ok) {
        return {
          error: result.error,
          retryAfterSeconds: result.retryAfterSeconds,
          clientErrorCode: result.clientErrorCode,
          ...(ephemeralTurn && mergedTeamCookie !== null ? { ephemeralTeamContextLocked: ephemeralLocked } : {}),
        };
      }
      return {
        ok: true,
        conversationId: result.conversationId,
        assistantMessage: result.assistantMessage,
        safeguarding: result.safeguarding,
        usedStaticSafeguarding: result.usedStaticSafeguarding ?? false,
        ...(ephemeralTurn && mergedTeamCookie !== null ? { ephemeralTeamContextLocked: ephemeralLocked } : {}),
      };
    };

    if (!ephemeralTurn) {
      return NextResponse.json(buildJson(), { status: result.ok ? 200 : result.status });
    }

    const res = NextResponse.json(buildJson(), { status: result.ok ? 200 : result.status });
    if (mergedTeamCookie !== null) {
      setTeamContextCookieOnResponse(res, mergedTeamCookie);
    }
    return res;
  } catch {
    return NextResponse.json({ error: "Request could not be completed." }, { status: 400 });
  }
}
