import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { canManageGivingRecords } from "@/lib/giving-access-server";
import { getUserFromSession, SESSION_COOKIE } from "@/lib/auth-server";
import { redactUserIdForLogs } from "@/lib/giving-privacy-redact";
import {
  listPendingOffPlatformIntentsForFinance,
  reviewOffPlatformIntent,
} from "@/lib/giving-hub-offplatform-server";

export const runtime = "nodejs";

export async function GET() {
  const cookieStore = await cookies();
  const user = await getUserFromSession(cookieStore.get(SESSION_COOKIE)?.value);
  if (!user) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }
  if (!(await canManageGivingRecords(user))) {
    return NextResponse.json({ error: "Finance access required." }, { status: 403 });
  }

  const pending = await listPendingOffPlatformIntentsForFinance();
  return NextResponse.json({
    pending: pending.map((row) => ({
      id: row.id,
      userIdRedacted: redactUserIdForLogs(row.userId),
      methodKey: row.methodKey,
      amount: row.amount,
      fund: row.fund,
      donorNote: row.donorNote,
      createdAt: row.createdAt.toISOString(),
    })),
  });
}

export async function PATCH(request: Request) {
  const cookieStore = await cookies();
  const user = await getUserFromSession(cookieStore.get(SESSION_COOKIE)?.value);
  if (!user) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }
  if (!(await canManageGivingRecords(user))) {
    return NextResponse.json({ error: "Finance access required." }, { status: 403 });
  }

  const body = await request.json().catch(() => ({}));
  const id = String(body.id ?? "").trim();
  const status = String(body.status ?? "").trim();
  if (!id || !["acknowledged", "matched", "dismissed"].includes(status)) {
    return NextResponse.json({ error: "id and valid status required." }, { status: 400 });
  }

  try {
    const updated = await reviewOffPlatformIntent({
      id,
      reviewerUserId: user.id,
      status: status as "acknowledged" | "matched" | "dismissed",
      financeNote: body.financeNote !== undefined ? String(body.financeNote) : undefined,
      matchedRecordId:
        body.matchedRecordId !== undefined ? String(body.matchedRecordId) : undefined,
    });
    return NextResponse.json({ ok: true, status: updated.status });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Review failed." },
      { status: 422 },
    );
  }
}
