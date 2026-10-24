import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getUserFromSession, SESSION_COOKIE } from "@/lib/auth-server";
import { buildPastoralTimeline } from "@/lib/marriage-pastoral-timeline-server";
import { counselorRouteErrorBody, counselorRouteErrorStatus } from "@/lib/marriage-counselor-api-security";

type Params = { params: Promise<{ journeyId: string }> };

export async function GET(_request: Request, { params }: Params) {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  const user = await getUserFromSession(token);
  if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });

  const { journeyId } = await params;
  try {
    const timeline = await buildPastoralTimeline(user, journeyId);
    return NextResponse.json(timeline);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Request failed.";
    return NextResponse.json(counselorRouteErrorBody(message), {
      status: counselorRouteErrorStatus(message),
    });
  }
}
