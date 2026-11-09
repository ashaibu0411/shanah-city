import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { confirmCheckoutGiftForMember } from "@/lib/giving-checkout-server";
import { linkGivingRecordsToUser } from "@/lib/giving-server";
import { getUserFromSession, SESSION_COOKIE } from "@/lib/auth-server";

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  const user = await getUserFromSession(token);

  if (!user) {
    return NextResponse.json({ error: "Sign in to confirm your gift." }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const sessionId = String(body.sessionId ?? "").trim();
  if (!sessionId.startsWith("cs_")) {
    return NextResponse.json({ error: "Invalid checkout session." }, { status: 400 });
  }

  const result = await confirmCheckoutGiftForMember(sessionId, user);
  if (!result.ok) {
    if (result.error === "forbidden") {
      return NextResponse.json({ error: "This checkout does not match your account." }, { status: 403 });
    }
    if (result.error === "unpaid") {
      return NextResponse.json(
        {
          error: "Payment is still processing.",
          paymentStatus: result.paymentStatus,
        },
        { status: 409 },
      );
    }
    return NextResponse.json(
      { error: "This gift is managed through recurring invoice webhooks." },
      { status: 422 },
    );
  }

  await linkGivingRecordsToUser(user.email, user.id);

  return NextResponse.json({
    recorded: Boolean(result.record),
    recordId: result.record?.id ?? null,
  });
}
