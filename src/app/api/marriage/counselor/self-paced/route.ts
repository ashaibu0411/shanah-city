import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getUserFromSession, SESSION_COOKIE } from "@/lib/auth-server";
import {
  counselorRouteErrorBody,
  counselorRouteErrorStatus,
} from "@/lib/marriage-counselor-api-security";
import {
  approveSelfPacedSession,
  buildCounselorSelfPacedReviewCenter,
  counselorAssignSelfPacedSession,
  getCounselorSessionReviewDetail,
  postClarificationMessage,
  publishCounselorSessionFeedback,
  saveCounselorFeedbackDraft,
  setJourneyCounselingDeliveryMode,
} from "@/lib/marriage-self-paced-server";
import { parseCounselingDeliveryMode } from "@/lib/marriage-counseling-delivery-mode";
import { buildCounselorSessionReviewWorkspace } from "@/lib/marriage-session-review-workspace";

export async function GET(request: Request) {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  const user = await getUserFromSession(token);
  if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });

  const url = new URL(request.url);
  const journeyId = url.searchParams.get("journeyId")?.trim();
  const sessionKey = url.searchParams.get("sessionKey")?.trim();

  try {
    if (journeyId && sessionKey) {
      const workspace = await buildCounselorSessionReviewWorkspace(user, journeyId, sessionKey);
      const detail = await getCounselorSessionReviewDetail(user, journeyId, sessionKey);
      return NextResponse.json({ ...detail, workspace });
    }
    const center = await buildCounselorSelfPacedReviewCenter(user);
    return NextResponse.json({ center });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Request failed.";
    return NextResponse.json(counselorRouteErrorBody(message), {
      status: counselorRouteErrorStatus(message),
    });
  }
}

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  const user = await getUserFromSession(token);
  if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });

  const body = await request.json();
  const action = String(body.action ?? "");

  try {
    if (action === "set_delivery_mode") {
      const mode = parseCounselingDeliveryMode(body.mode);
      if (!mode) throw new Error("Invalid counseling delivery mode.");
      const journey = await setJourneyCounselingDeliveryMode(
        user,
        String(body.journeyId ?? ""),
        mode,
        body.note ? String(body.note) : undefined,
      );
      return NextResponse.json({ ok: true, journey });
    }
    if (action === "assign_session") {
      const review = await counselorAssignSelfPacedSession(
        user,
        String(body.journeyId ?? ""),
        String(body.sessionKey ?? ""),
        Array.isArray(body.moduleIds) ? body.moduleIds.map(String) : undefined,
      );
      return NextResponse.json({ ok: true, review });
    }
    if (action === "save_feedback_draft") {
      const review = await saveCounselorFeedbackDraft(
        user,
        String(body.journeyId ?? ""),
        String(body.sessionKey ?? ""),
        body.feedback ?? {},
      );
      return NextResponse.json({ ok: true, review });
    }
    if (action === "publish_feedback") {
      const review = await publishCounselorSessionFeedback(
        user,
        String(body.journeyId ?? ""),
        String(body.sessionKey ?? ""),
      );
      return NextResponse.json({ ok: true, review });
    }
    if (action === "approve_session") {
      const review = await approveSelfPacedSession(
        user,
        String(body.journeyId ?? ""),
        String(body.sessionKey ?? ""),
      );
      return NextResponse.json({ ok: true, review });
    }
    if (action === "post_clarification") {
      const message = await postClarificationMessage(
        user,
        String(body.journeyId ?? ""),
        String(body.sessionKey ?? ""),
        String(body.body ?? ""),
      );
      return NextResponse.json({ ok: true, message });
    }
    return NextResponse.json({ error: "Unknown action." }, { status: 400 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Request failed.";
    return NextResponse.json(counselorRouteErrorBody(message), {
      status: counselorRouteErrorStatus(message),
    });
  }
}
