import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { canManageGivingRecords } from "@/lib/giving-access-server";
import { getUserFromSession, SESSION_COOKIE } from "@/lib/auth-server";
import { applyTargetedCheckoutGiftRecovery } from "@/lib/giving-stripe-recovery-server";
import { isGivingGiftRecoveryAuditTableReady } from "@/lib/giving-stripe-recovery-migration-guard";

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  const user = await getUserFromSession(token);

  if (!user) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }

  if (!(await canManageGivingRecords(user))) {
    return NextResponse.json(
      { error: "Finance Team or Admin Group access required." },
      { status: 403 },
    );
  }

  if (!(await isGivingGiftRecoveryAuditTableReady())) {
    return NextResponse.json(
      {
        error:
          "Gift recovery is disabled until migration 20261110020000_giving_stripe_gift_recovery_audit is applied on production.",
      },
      { status: 503 },
    );
  }

  const body = await request.json().catch(() => ({}));
  const confirm = String(body.confirm ?? "").trim();
  if (confirm !== "RECOVER_VERIFIED_CHECKOUT_GIFT") {
    return NextResponse.json(
      {
        error:
          'Targeted recovery requires confirm: "RECOVER_VERIFIED_CHECKOUT_GIFT" after verifying Stripe ownership in the member reconciliation report.',
      },
      { status: 400 },
    );
  }

  const memberUserId = String(body.memberUserId ?? "").trim();
  const stripeSessionId = String(body.stripeSessionId ?? "").trim();
  if (!memberUserId || !stripeSessionId.startsWith("cs_")) {
    return NextResponse.json(
      { error: "Provide memberUserId and a cs_ checkout session id from verified finance review." },
      { status: 400 },
    );
  }

  try {
    const result = await applyTargetedCheckoutGiftRecovery({
      memberUserId,
      stripeSessionId,
      actor: user,
    });
    return NextResponse.json(result, { status: result.ok ? 200 : 422 });
  } catch (error) {
    console.error("Targeted checkout gift recovery failed:", error);
    return NextResponse.json({ error: "Could not complete targeted recovery." }, { status: 500 });
  }
}
