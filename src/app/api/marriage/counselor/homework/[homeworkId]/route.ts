import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getUserFromSession, SESSION_COOKIE } from "@/lib/auth-server";
import {
  counselorRouteErrorBody,
  counselorRouteErrorStatus,
} from "@/lib/marriage-counselor-api-security";
import {
  counselorApproveHomeworkSubmission,
  counselorRequestHomeworkRevision,
  getCounselorHomeworkDetail,
  releaseSessionHomework,
  reopenSessionHomework,
  updateSessionHomeworkDraft,
} from "@/lib/marriage-homework-server";
import type { MarriageHomeworkActivityDef } from "@/lib/marriage-homework-types";

type Params = { params: Promise<{ homeworkId: string }> };

export async function GET(_request: Request, { params }: Params) {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  const user = await getUserFromSession(token);
  if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });

  const { homeworkId } = await params;
  try {
    const detail = await getCounselorHomeworkDetail(user, homeworkId);
    return NextResponse.json(detail, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Request failed.";
    return NextResponse.json(counselorRouteErrorBody(message), {
      status: counselorRouteErrorStatus(message),
    });
  }
}

export async function PATCH(request: Request, { params }: Params) {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  const user = await getUserFromSession(token);
  if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });

  const { homeworkId } = await params;
  const body = await request.json();
  const action = body.action ? String(body.action) : "save";

  try {
    if (action === "release") {
      const homework = await releaseSessionHomework(user, homeworkId);
      return NextResponse.json({ ok: true, homework });
    }
    if (action === "reopen") {
      const homework = await reopenSessionHomework(user, homeworkId);
      return NextResponse.json({ ok: true, homework });
    }
    if (action === "request_revision") {
      const result = await counselorRequestHomeworkRevision(
        user,
        homeworkId,
        String(body.partnerUserId ?? ""),
        String(body.revisionNote ?? ""),
      );
      return NextResponse.json(result);
    }
    if (action === "approve_submission") {
      const result = await counselorApproveHomeworkSubmission(
        user,
        homeworkId,
        String(body.partnerUserId ?? ""),
      );
      return NextResponse.json(result);
    }
    const homework = await updateSessionHomeworkDraft(user, homeworkId, {
      title: body.title !== undefined ? String(body.title) : undefined,
      instructions: body.instructions !== undefined ? String(body.instructions) : undefined,
      dueAtLocal: body.dueAtLocal ? String(body.dueAtLocal) : undefined,
      dueAt: body.dueAt ? String(body.dueAt) : undefined,
      schedulingTimeZone: body.schedulingTimeZone ? String(body.schedulingTimeZone) : undefined,
      counselorPrivateNotes:
        body.counselorPrivateNotes !== undefined ? String(body.counselorPrivateNotes) : undefined,
      partnerFeedback:
        body.partnerFeedback && typeof body.partnerFeedback === "object"
          ? (body.partnerFeedback as Record<string, string>)
          : undefined,
      sessionId: body.sessionId !== undefined ? String(body.sessionId) : undefined,
      activities: Array.isArray(body.activities)
        ? (body.activities as MarriageHomeworkActivityDef[])
        : undefined,
    });
    return NextResponse.json({ ok: true, homework });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Request failed.";
    return NextResponse.json(counselorRouteErrorBody(message), {
      status: counselorRouteErrorStatus(message),
    });
  }
}
