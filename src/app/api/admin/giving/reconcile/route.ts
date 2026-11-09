import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { canManageGivingRecords } from "@/lib/giving-access-server";
import { getUserFromSession, SESSION_COOKIE } from "@/lib/auth-server";
import { applyMissingStripeGifts, reportMissingStripeGifts } from "@/lib/giving-reconcile-server";

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
  const limit = Number(searchParams.get("limit") ?? "100");

  try {
    const report = await reportMissingStripeGifts({ days, limit });
    return NextResponse.json(report);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not run reconciliation report." },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  const auth = await requireGivingManager();
  if (auth.error) return auth.error;

  const body = await request.json().catch(() => ({}));
  const confirm = String(body.confirm ?? "").trim();
  if (confirm !== "APPLY_STRIPE_GIVING_BACKFILL") {
    return NextResponse.json(
      {
        error:
          'Backfill requires confirm: "APPLY_STRIPE_GIVING_BACKFILL" after reviewing the dry-run report.',
      },
      { status: 400 },
    );
  }

  const sessionIds = Array.isArray(body.sessionIds)
    ? body.sessionIds.map((id: unknown) => String(id).trim()).filter((id: string) => id.startsWith("cs_"))
    : [];
  const invoiceIds = Array.isArray(body.invoiceIds)
    ? body.invoiceIds.map((id: unknown) => String(id).trim()).filter((id: string) => id.startsWith("in_"))
    : [];

  if (sessionIds.length === 0 && invoiceIds.length === 0) {
    return NextResponse.json({ error: "Provide sessionIds and/or invoiceIds from the dry-run report." }, { status: 400 });
  }

  try {
    const result = await applyMissingStripeGifts({ sessionIds, invoiceIds });
    return NextResponse.json({
      ...result,
      message:
        "Backfill completed. Only paid Stripe sessions/invoices were recorded; existing rows were left unchanged.",
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not apply backfill." },
      { status: 500 },
    );
  }
}
