import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getUserFromSession, SESSION_COOKIE } from "@/lib/auth-server";
import {
  createOffPlatformGivingIntent,
  listOffPlatformIntentsForMember,
} from "@/lib/giving-hub-offplatform-server";
import { fundLabel } from "@/lib/giving-types";

export const runtime = "nodejs";

export async function GET() {
  const cookieStore = await cookies();
  const user = await getUserFromSession(cookieStore.get(SESSION_COOKIE)?.value);
  if (!user) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }

  const rows = await listOffPlatformIntentsForMember(user.id);
  return NextResponse.json({
    intents: rows.map((row) => ({
      id: row.id,
      methodKey: row.methodKey,
      amount: row.amount,
      fund: row.fund,
      fundLabel: fundLabel(row.fund as never),
      status: row.status,
      donorNote: row.donorNote,
      createdAt: row.createdAt.toISOString(),
    })),
  });
}

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const user = await getUserFromSession(cookieStore.get(SESSION_COOKIE)?.value);
  if (!user) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const methodKey = String(body.methodKey ?? "").trim();
  const amount = Number(body.amount);
  const fund = String(body.fund ?? "offering").trim();
  const donorNote = String(body.donorNote ?? "").trim();

  try {
    const created = await createOffPlatformGivingIntent({
      userId: user.id,
      methodKey,
      amount,
      fund,
      donorNote: donorNote || undefined,
    });
    return NextResponse.json({
      id: created.id,
      status: created.status,
      message:
        "Thanks — Finance will match this gift to your profile after verifying the transfer. This does not replace sending the payment in Zelle or Cash App.",
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not save intent." },
      { status: 422 },
    );
  }
}
