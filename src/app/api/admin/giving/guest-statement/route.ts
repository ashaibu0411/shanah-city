import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { canManageGivingRecords } from "@/lib/giving-access-server";
import { getUserFromSession, SESSION_COOKIE } from "@/lib/auth-server";
import { normalizeGivingEmail } from "@/lib/giving-types";
import { listGivingRecords } from "@/lib/giving-server";
import { sendGuestGivingStatement } from "@/lib/giving-notify-server";

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

export async function POST(request: Request) {
  const auth = await requireGivingManager();
  if (auth.error) return auth.error;

  const body = await request.json();
  const donorEmail = normalizeGivingEmail(String(body.donorEmail ?? ""));
  if (!donorEmail) {
    return NextResponse.json({ error: "Enter a donor email address." }, { status: 400 });
  }

  const since = body.since ? String(body.since).trim() : undefined;
  const until = body.until ? String(body.until).trim() : undefined;
  const donorName = body.donorName ? String(body.donorName).trim() : undefined;

  const records = await listGivingRecords({
    since,
    until,
    donorEmail,
  });

  const result = await sendGuestGivingStatement({
    donorEmail,
    donorName,
    since,
    until,
    records,
  });

  if (!result.sent) {
    const message =
      result.reason === "no_records"
        ? "No gifts found for that email in this date range."
        : result.reason === "not_configured"
          ? "Email is not configured yet. Add RESEND_API_KEY and RESEND_FROM_EMAIL in Vercel."
          : "Could not send the guest giving statement.";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  return NextResponse.json({
    ok: true,
    giftCount: result.giftCount,
    totalAmount: result.totalAmount,
  });
}
