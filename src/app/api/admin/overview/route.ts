import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getUserFromSession, SESSION_COOKIE } from "@/lib/auth-server";
import { buildAdminOverview } from "@/lib/admin-overview-server";
import { canManageAsAdmin } from "@/lib/admin-access-server";
import { canReviewMinistryReports } from "@/lib/ministry-report-access-server";

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  const user = await getUserFromSession(token);

  if (!user) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }

  const [isAdmin, isPastoral] = await Promise.all([
    canManageAsAdmin(user),
    canReviewMinistryReports(user),
  ]);

  if (!isAdmin && !isPastoral) {
    return NextResponse.json({ error: "Pastoral or admin access required." }, { status: 403 });
  }

  const overview = await buildAdminOverview(user);
  return NextResponse.json({ overview });
}
