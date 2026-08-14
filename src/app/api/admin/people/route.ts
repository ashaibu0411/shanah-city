import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { canManageAsAdmin } from "@/lib/admin-access-server";
import { getAdminPeopleDirectory } from "@/lib/admin-people-server";
import { getUserFromSession, SESSION_COOKIE } from "@/lib/auth-server";

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  const user = await getUserFromSession(token);

  if (!user) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }

  if (!(await canManageAsAdmin(user))) {
    return NextResponse.json({ error: "Admin Group access required." }, { status: 403 });
  }

  const people = await getAdminPeopleDirectory(user.id);
  return NextResponse.json({ people });
}
