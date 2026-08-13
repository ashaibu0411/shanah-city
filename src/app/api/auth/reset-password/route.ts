import { NextResponse } from "next/server";
import { completePasswordReset } from "@/lib/password-reset-server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    await completePasswordReset(String(body.token ?? ""), String(body.password ?? ""));
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not reset password." },
      { status: 400 },
    );
  }
}
