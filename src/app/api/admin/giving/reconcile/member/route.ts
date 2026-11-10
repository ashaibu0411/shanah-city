import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { canManageGivingRecords } from "@/lib/giving-access-server";
import { getUserFromSession, SESSION_COOKIE } from "@/lib/auth-server";
import { buildMemberStripeReconciliationReport } from "@/lib/giving-reconcile-member-server";

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

/** Read-only member Stripe reconciliation (no financial writes). */
export async function GET(request: Request) {
  const auth = await requireGivingManager();
  if (auth.error) return auth.error;

  const { searchParams } = new URL(request.url);
  const memberUserId = searchParams.get("memberUserId")?.trim();
  if (!memberUserId) {
    return NextResponse.json({ error: "memberUserId query parameter is required." }, { status: 400 });
  }

  const since = searchParams.get("since")?.trim() || undefined;
  const until = searchParams.get("until")?.trim() || undefined;

  try {
    const report = await buildMemberStripeReconciliationReport({
      memberUserId,
      since,
      until,
    });
    return NextResponse.json(report, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not build member reconciliation report." },
      { status: 500 },
    );
  }
}
