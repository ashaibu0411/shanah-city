import { NextResponse } from "next/server";
import { requestPasswordReset } from "@/lib/password-reset-server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = await requestPasswordReset(String(body.email ?? ""));
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not request reset." },
      { status: 400 },
    );
  }
}
