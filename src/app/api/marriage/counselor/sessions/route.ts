import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getUserFromSession, SESSION_COOKIE } from "@/lib/auth-server";
import {
  createCounselingSession,
  updateCounselingSession,
} from "@/lib/marriage-counseling-counselor-server";
import {
  counselorRouteErrorBody,
  counselorRouteErrorStatus,
} from "@/lib/marriage-counselor-api-security";
import { normalizeNewSessionScheduledAtInput } from "@/lib/marriage-session-scheduling";

function resolveScheduledAtFromBody(body: Record<string, unknown>) {
  if (!body.scheduledAt && !body.scheduledAtLocal) return undefined;
  return normalizeNewSessionScheduledAtInput({
    scheduledAtLocal: body.scheduledAtLocal ? String(body.scheduledAtLocal) : undefined,
    scheduledAt: body.scheduledAt ? String(body.scheduledAt) : undefined,
    schedulingTimeZone: body.schedulingTimeZone ? String(body.schedulingTimeZone) : undefined,
  });
}

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  const user = await getUserFromSession(token);
  if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });

  const body = await request.json();
  const action = String(body.action ?? "create");

  try {
    if (action === "create") {
      const scheduling = resolveScheduledAtFromBody(body as Record<string, unknown>);
      if (!scheduling) {
        return NextResponse.json({ error: "Scheduled time is required." }, { status: 400 });
      }
      const session = await createCounselingSession(user, {
        journeyId: String(body.journeyId ?? ""),
        scheduledAt: scheduling.scheduledAt,
        schedulingTimeZone: scheduling.schedulingTimeZone,
        topic: body.topic ? String(body.topic) : undefined,
        zoomUrl: body.zoomUrl ? String(body.zoomUrl) : undefined,
        prepModuleIds: Array.isArray(body.prepModuleIds) ? body.prepModuleIds.map(String) : undefined,
        homework: Array.isArray(body.homework) ? body.homework : undefined,
      });
      return NextResponse.json({ ok: true, session });
    }
    if (action === "update") {
      const scheduling = resolveScheduledAtFromBody(body as Record<string, unknown>);
      const session = await updateCounselingSession(user, String(body.sessionId ?? ""), {
        scheduledAt: scheduling?.scheduledAt,
        schedulingTimeZone: scheduling?.schedulingTimeZone,
        topic: body.topic ? String(body.topic) : undefined,
        zoomUrl: body.zoomUrl ? String(body.zoomUrl) : undefined,
        status: body.status,
        notes: body.notes ? String(body.notes) : undefined,
      });
      return NextResponse.json({ ok: true, session });
    }
    return NextResponse.json({ error: "Unknown action." }, { status: 400 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Request failed.";
    return NextResponse.json(counselorRouteErrorBody(message), {
      status: counselorRouteErrorStatus(message),
    });
  }
}
