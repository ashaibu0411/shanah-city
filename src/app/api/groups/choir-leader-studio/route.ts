import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getUserFromSession, SESSION_COOKIE } from "@/lib/auth-server";
import { SHANAH_WORSHIP_GROUP_ID } from "@/lib/choir-group-constants";
import { buildLeaderStudioOverviewPayload } from "@/lib/choir-leader-studio-server";

export async function GET(request: Request) {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  const user = await getUserFromSession(token);

  if (!user) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const groupId = searchParams.get("groupId")?.trim() ?? SHANAH_WORSHIP_GROUP_ID;
  const view = searchParams.get("view")?.trim() ?? "overview";

  if (view === "overview") {
    const payload = await buildLeaderStudioOverviewPayload(user, groupId);
    if (!payload) return NextResponse.json({ error: "Access denied." }, { status: 403 });
    return NextResponse.json({ payload });
  }

  return NextResponse.json({ error: "Unknown view." }, { status: 400 });
}
