import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { canManageAsAdmin } from "@/lib/admin-access-server";
import { getAdminPeopleDirectory } from "@/lib/admin-people-server";
import { getAdminPerson, updateAdminPerson } from "@/lib/admin-people-update-server";
import { getUserFromSession, SESSION_COOKIE } from "@/lib/auth-server";

export async function GET(request: Request) {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  const user = await getUserFromSession(token);

  if (!user) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }

  if (!(await canManageAsAdmin(user))) {
    return NextResponse.json({ error: "Admin Group access required." }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("userId");

  if (userId) {
    const person = await getAdminPerson(user.id, userId);
    if (!person) {
      return NextResponse.json({ error: "Member not found." }, { status: 404 });
    }
    return NextResponse.json({ person });
  }

  const people = await getAdminPeopleDirectory(user.id);
  return NextResponse.json({ people });
}

export async function PATCH(request: Request) {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  const user = await getUserFromSession(token);

  if (!user) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }

  if (!(await canManageAsAdmin(user))) {
    return NextResponse.json({ error: "Admin Group access required." }, { status: 403 });
  }

  const body = await request.json();
  const userId = String(body.userId ?? "");

  if (!userId) {
    return NextResponse.json({ error: "Member id is required." }, { status: 400 });
  }

  try {
    const person = await updateAdminPerson(user.id, userId, body);
    return NextResponse.json({ person });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not update member." },
      { status: 400 },
    );
  }
}
