import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getUserFromSession, SESSION_COOKIE } from "@/lib/auth-server";
import { createCounselorActivityAssignment } from "@/lib/marriage-counseling-counselor-server";

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  const user = await getUserFromSession(token);
  if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });

  const body = await request.json();
  try {
    const assignment = await createCounselorActivityAssignment(user, {
      journeyId: String(body.journeyId ?? ""),
      title: String(body.title ?? ""),
      description: body.description ? String(body.description) : undefined,
      moduleId: body.moduleId ? String(body.moduleId) : undefined,
      dueAt: body.dueAt ? String(body.dueAt) : undefined,
    });
    return NextResponse.json({ ok: true, assignment });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Request failed." },
      { status: 403 },
    );
  }
}
