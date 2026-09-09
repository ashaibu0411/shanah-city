import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getUserFromSession, SESSION_COOKIE } from "@/lib/auth-server";
import { buildGroupDashboard } from "@/lib/group-dashboard-server";

export async function GET(request: Request) {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  const user = await getUserFromSession(token);

  if (!user) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const groupId = searchParams.get("groupId")?.trim();
  if (!groupId) {
    return NextResponse.json({ error: "Group id is required." }, { status: 400 });
  }

  const dashboard = await buildGroupDashboard(user, groupId);
  if (!dashboard) {
    return NextResponse.json({ error: "Group not found or access denied." }, { status: 403 });
  }

  return NextResponse.json({ dashboard });
}
