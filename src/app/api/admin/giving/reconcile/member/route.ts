import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { canManageGivingRecords } from "@/lib/giving-access-server";
import { getUserFromSession, SESSION_COOKIE } from "@/lib/auth-server";
import {
  GIVING_FINANCE_GENERIC_ERROR,
  GivingFinanceValidationError,
  logGivingFinanceApiError,
} from "@/lib/giving-finance-api-error";
import { buildMemberStripeReconciliationReport } from "@/lib/giving-reconcile-member-server";
import { parseGivingReconcileDateWindow } from "@/lib/giving-reconcile-window";

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

  const since = searchParams.get("since")?.trim();
  const until = searchParams.get("until")?.trim();
  const windowCheck = parseGivingReconcileDateWindow(since, until);
  if (!windowCheck.ok) {
    return NextResponse.json({ error: windowCheck.message }, { status: 400 });
  }

  try {
    const report = await buildMemberStripeReconciliationReport({
      memberUserId,
      since: windowCheck.window.since,
      until: windowCheck.window.until,
    });
    return NextResponse.json(report, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    if (error instanceof GivingFinanceValidationError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    const message = error instanceof Error ? error.message : "";
    if (message === "Member not found.") {
      return NextResponse.json({ error: "Member not found." }, { status: 404 });
    }
    if (message === "Member has no linked stripeCustomerId.") {
      return NextResponse.json({ error: "Member has no linked Stripe customer." }, { status: 404 });
    }
    if (message === "Stripe is not configured.") {
      return NextResponse.json({ error: "Stripe is not configured for this environment." }, { status: 503 });
    }
    logGivingFinanceApiError("reconcile/member", error);
    return NextResponse.json({ error: GIVING_FINANCE_GENERIC_ERROR }, { status: 500 });
  }
}
