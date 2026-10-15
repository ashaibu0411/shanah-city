import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getUserFromSession, SESSION_COOKIE } from "@/lib/auth-server";
import { markDiscussion } from "@/lib/marriage-counseling-server";

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  const user = await getUserFromSession(token);
  if (!user) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }
  const body = await request.json();
  try {
    const mark = await markDiscussion(
      user,
      String(body.moduleId ?? ""),
      String(body.questionId ?? ""),
      body.sharedNote ? String(body.sharedNote) : undefined,
    );
    return NextResponse.json({ ok: true, mark });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not save." },
      { status: 400 },
    );
  }
}
