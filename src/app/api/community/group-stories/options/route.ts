import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getUserFromSession, SESSION_COOKIE } from "@/lib/auth-server";
import { listGroupsUserCanPostCommunityStories } from "@/lib/group-community-story-server";

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  const user = await getUserFromSession(token);

  if (!user) {
    return NextResponse.json({ error: "Sign in required.", groups: [] }, { status: 401 });
  }

  const groups = await listGroupsUserCanPostCommunityStories(user.id);
  return NextResponse.json({ groups });
}
