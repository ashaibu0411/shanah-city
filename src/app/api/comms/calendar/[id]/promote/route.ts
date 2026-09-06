import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { canManageAsAdmin } from "@/lib/admin-access-server";
import { getUserFromSession, SESSION_COOKIE } from "@/lib/auth-server";
import { promoteCommsCalendarItem } from "@/lib/comms-promote-server";
import { resolveCommsPublishTargets } from "@/lib/comms-constants";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: Request, context: RouteContext) {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  const user = await getUserFromSession(token);

  if (!user || !(await canManageAsAdmin(user))) {
    return NextResponse.json({ error: "Admin access required." }, { status: 403 });
  }

  const { id } = await context.params;
  const body = await request.json();
  const targets = resolveCommsPublishTargets(body);

  if (!targets.homeBanner && !targets.community && !targets.push) {
    return NextResponse.json(
      { error: "Choose at least one destination or use the publish bundle." },
      { status: 400 },
    );
  }

  try {
    const result = await promoteCommsCalendarItem(
      id,
      user,
      targets,
    );
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not complete action." },
      { status: 400 },
    );
  }
}
