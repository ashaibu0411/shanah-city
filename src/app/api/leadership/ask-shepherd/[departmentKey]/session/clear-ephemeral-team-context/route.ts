import { NextResponse } from "next/server";
import { requireAskShepherdApiRequest } from "@/lib/ask-shepherd-route";
import { parseAskShepherdDepartmentKey } from "@/lib/ask-shepherd-departments";
import {
  assertNotAdminBypassingAskShepherd,
  resolveAskShepherdAccess,
} from "@/lib/ask-shepherd-access-server";
import { clearTeamContextCookieOnResponse } from "@/lib/ask-shepherd-team-context-cookie";

/**
 * Clears the server-signed "ephemeral team context" cookie after **New chat**
 * so a fresh unsaved session can be saved without carrying over team-context state.
 */
export async function POST(
  _request: Request,
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
      return NextResponse.json({ error: "Not authorized for Ask Shepherd." }, { status: 403 });
    }

    const res = NextResponse.json({ ok: true });
    clearTeamContextCookieOnResponse(res);
    return res;
  } catch {
    return NextResponse.json({ error: "Request could not be completed." }, { status: 400 });
  }
}
