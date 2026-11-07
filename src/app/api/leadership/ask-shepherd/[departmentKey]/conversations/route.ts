import { NextResponse } from "next/server";
import { requireAskShepherdApiRequest } from "@/lib/ask-shepherd-route";
import { parseAskShepherdDepartmentKey } from "@/lib/ask-shepherd-departments";
import {
  assertNotAdminBypassingAskShepherd,
  resolveAskShepherdAccess,
} from "@/lib/ask-shepherd-access-server";
import { listConversations } from "@/lib/ask-shepherd-server";

export async function GET(
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
      return NextResponse.json({ error: "Not authorized." }, { status: 403 });
    }

    const all = await listConversations(user.id, def.key);
    const saved = all.filter((c) => c.savedToLibrary);
    return NextResponse.json({ conversations: all, savedGuidance: saved });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Error";
    return NextResponse.json({ error: msg }, { status: 403 });
  }
}
