import { NextResponse } from "next/server";
import { requireAskShepherdApiRequest } from "@/lib/ask-shepherd-route";
import { parseAskShepherdDepartmentKey } from "@/lib/ask-shepherd-departments";
import {
  assertNotAdminBypassingAskShepherd,
  resolveAskShepherdAccess,
} from "@/lib/ask-shepherd-access-server";
import { isAskShepherdAiConfigured } from "@/lib/ask-shepherd-ai-server";

const CATEGORIES = [
  { id: "communication", label: "Communication guidance" },
  { id: "team-challenges", label: "Team challenges" },
  { id: "leadership-development", label: "Leadership development" },
  { id: "conflict", label: "Conflict and repair" },
  { id: "volunteers", label: "Volunteer care" },
  { id: "general", label: "General" },
] as const;

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
      return NextResponse.json({ error: "Not authorized for Ask Shepherd." }, { status: 403 });
    }

    return NextResponse.json({
      department: def,
      access,
      categories: CATEGORIES,
      aiConfigured: isAskShepherdAiConfigured(),
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Error";
    return NextResponse.json({ error: msg }, { status: 403 });
  }
}
