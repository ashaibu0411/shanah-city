import { NextResponse } from "next/server";
import { requireAskShepherdApiRequest } from "@/lib/ask-shepherd-route";
import { parseAskShepherdDepartmentKey } from "@/lib/ask-shepherd-departments";
import {
  assertNotAdminBypassingAskShepherd,
  resolveAskShepherdAccess,
} from "@/lib/ask-shepherd-access-server";
import { getGroups } from "@/lib/group-server";
import { getUserById } from "@/lib/auth-server";
import { getPublicDisplayName } from "@/lib/member-display-name";
import { buildLeaderHighlightsForUser } from "@/lib/temperament-shepherding-server";

export async function GET(
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

    const groups = await getGroups();
    const group = groups.find((g) => g.id === def.groupId);
    if (!group) {
      return NextResponse.json({ members: [] });
    }

    const q = new URL(request.url).searchParams.get("q")?.trim().toLowerCase() ?? "";
    const ids = [...new Set(group.memberIds)].filter((id) => id !== user.id);
    const out: { id: string; name: string; hasSharedTemperamentSummary: boolean }[] = [];

    for (const id of ids.slice(0, 100)) {
      const memberUser = await getUserById(id);
      if (!memberUser) continue;
      const name = getPublicDisplayName(memberUser);
      if (q && !name.toLowerCase().includes(q) && !memberUser.email.toLowerCase().includes(q)) {
        continue;
      }
      const highlights = await buildLeaderHighlightsForUser({
        subjectUserId: id,
        departmentKey: def.temperamentDepartmentKey,
      });
      out.push({
        id,
        name,
        hasSharedTemperamentSummary: Boolean(highlights),
      });
    }

    out.sort((a, b) => a.name.localeCompare(b.name));
    return NextResponse.json({ members: out });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Error";
    return NextResponse.json({ error: msg }, { status: 403 });
  }
}
