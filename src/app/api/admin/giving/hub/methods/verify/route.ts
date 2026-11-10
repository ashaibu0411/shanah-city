import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { canManageGivingRecords } from "@/lib/giving-access-server";
import { getUserFromSession, SESSION_COOKIE } from "@/lib/auth-server";
import { verifyGivingHubPaymentMethod } from "@/lib/giving-hub-server";

export const runtime = "nodejs";

export async function POST(request: Request) {
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
  if (!id) {
    return NextResponse.json({ error: "id required." }, { status: 400 });
  }

  const updated = await verifyGivingHubPaymentMethod({
    id,
    verifiedByUserId: user.id,
    publish: body.publish === true,
  });
  if (!updated) {
    return NextResponse.json({ error: "Method not found." }, { status: 404 });
  }

  return NextResponse.json({
    ok: true,
    verifiedAt: updated.verifiedAt?.toISOString() ?? null,
    published: updated.published,
  });
}
