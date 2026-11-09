import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { canManageGivingRecords } from "@/lib/giving-access-server";
import { getUserById, getUserFromSession, SESSION_COOKIE } from "@/lib/auth-server";
import { buildGivingHistoryIncidentReport } from "@/lib/giving-diagnostic-server";

async function requireGivingManager() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  const user = await getUserFromSession(token);

  if (!user) {
    return { error: NextResponse.json({ error: "Sign in required." }, { status: 401 }) };
  }

  if (!(await canManageGivingRecords(user))) {
    return {
      error: NextResponse.json(
        { error: "Finance Team or Admin Group access required." },
        { status: 403 },
      ),
    };
  }

  return { user };
}

export async function GET(request: Request) {
  const auth = await requireGivingManager();
  if (auth.error) return auth.error;

  const { searchParams } = new URL(request.url);
  const days = Number(searchParams.get("days") ?? "90");
  const memberUserId = searchParams.get("memberUserId")?.trim();
  let memberEmail: string | undefined;

  if (memberUserId) {
    const member = await getUserById(memberUserId);
    if (!member) {
      return NextResponse.json({ error: "Member not found for memberUserId." }, { status: 404 });
    }
    memberEmail = member.email;
  }

  try {
    const report = await buildGivingHistoryIncidentReport({
      days,
      memberUserId,
      memberEmail,
    });
    return NextResponse.json(report, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not build diagnostic." },
      { status: 500 },
    );
  }
}
