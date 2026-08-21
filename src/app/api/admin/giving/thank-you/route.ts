import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getUserFromSession, SESSION_COOKIE } from "@/lib/auth-server";
import { canManageGivingRecords } from "@/lib/giving-access-server";
import { getGivingRecordById, markThankYouSent } from "@/lib/giving-server";
import {
  previewGivingThankYou,
  sendGivingThankYou,
} from "@/lib/giving-notify-server";

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
  const recordId = searchParams.get("recordId") ?? "";
  if (!recordId) {
    return NextResponse.json({ error: "Record id is required." }, { status: 400 });
  }

  const record = await getGivingRecordById(recordId);
  if (!record) {
    return NextResponse.json({ error: "Giving record not found." }, { status: 404 });
  }

  const preview = await previewGivingThankYou(record);
  return NextResponse.json({ record, ...preview });
}

export async function POST(request: Request) {
  const auth = await requireGivingManager();
  if (auth.error) return auth.error;

  const body = await request.json();
  const recordId = String(body.recordId ?? "");
  const message = body.message ? String(body.message) : undefined;

  if (!recordId) {
    return NextResponse.json({ error: "Record id is required." }, { status: 400 });
  }

  const record = await getGivingRecordById(recordId);
  if (!record) {
    return NextResponse.json({ error: "Giving record not found." }, { status: 404 });
  }

  const preview = await previewGivingThankYou(record);
  if (!preview.canSend) {
    return NextResponse.json(
      {
        error: record.userId
          ? "This member cannot receive a thank-you."
          : "Add a donor email or link a member profile to send a thank-you.",
      },
      { status: 400 },
    );
  }

  const result = await sendGivingThankYou(record, {
    notifier: { id: auth.user!.id },
    message,
  });

  if (!result.sent) {
    const errorMessage =
      result.reason === "not_configured"
        ? "Email is not configured yet. Add RESEND_API_KEY and RESEND_FROM_EMAIL in Vercel."
        : "Could not send the thank-you message.";
    return NextResponse.json({ error: errorMessage }, { status: 400 });
  }

  const updated = await markThankYouSent(recordId);
  return NextResponse.json({
    ok: true,
    channel: result.channel,
    record: updated,
  });
}
