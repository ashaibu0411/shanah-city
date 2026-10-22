import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getUserFromSession, SESSION_COOKIE } from "@/lib/auth-server";
import { assertMarriageCounselorRole } from "@/lib/marriage-counseling-access";
import { listCounselorSessionTopicOptions } from "@/lib/marriage-counselor-session-topics";
import {
  counselorRouteErrorBody,
  counselorRouteErrorStatus,
} from "@/lib/marriage-counselor-api-security";

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  const user = await getUserFromSession(token);
  if (!user) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }

  try {
    await assertMarriageCounselorRole(user);
    const topics = await listCounselorSessionTopicOptions();
    return NextResponse.json({ topics });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Access denied.";
    return NextResponse.json(counselorRouteErrorBody(message), {
      status: counselorRouteErrorStatus(message),
    });
  }
}
