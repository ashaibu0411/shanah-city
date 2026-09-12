import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { canManageAsAdmin } from "@/lib/admin-access-server";
import { getUserFromSession, SESSION_COOKIE } from "@/lib/auth-server";
import type { PastoralRole } from "@/lib/pastoral-roles-types";
import { PASTORAL_ROLES } from "@/lib/pastoral-roles-types";
import {
  getPastoralRoleAssignmentViews,
  setPastoralRoleAssignment,
} from "@/lib/pastoral-roles-server";

function parseRole(value: unknown): PastoralRole | null {
  const role = String(value ?? "");
  return PASTORAL_ROLES.includes(role as PastoralRole) ? (role as PastoralRole) : null;
}

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  const user = await getUserFromSession(token);

  if (!user || !(await canManageAsAdmin(user))) {
    return NextResponse.json({ error: "Admin Group access required." }, { status: 403 });
  }

  const assignments = await getPastoralRoleAssignmentViews();
  return NextResponse.json({ assignments });
}

export async function PATCH(request: Request) {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  const user = await getUserFromSession(token);

  if (!user || !(await canManageAsAdmin(user))) {
    return NextResponse.json({ error: "Admin Group access required." }, { status: 403 });
  }

  const body = await request.json();
  const role = parseRole(body.role);
  if (!role) {
    return NextResponse.json({ error: "Choose Senior Pastor or Associate Pastor." }, { status: 400 });
  }

  const userIdRaw = body.userId;
  const userId =
    userIdRaw === null || userIdRaw === undefined || userIdRaw === ""
      ? null
      : String(userIdRaw).trim();

  try {
    await setPastoralRoleAssignment({
      role,
      userId,
      updatedBy: user.id,
      updatedByName: user.name,
    });
    const assignments = await getPastoralRoleAssignmentViews();
    return NextResponse.json({ assignments });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not update pastoral role." },
      { status: 400 },
    );
  }
}
