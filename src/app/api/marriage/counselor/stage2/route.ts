import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getUserFromSession, SESSION_COOKIE } from "@/lib/auth-server";
import {
  counselorRouteErrorBody,
  counselorRouteErrorStatus,
} from "@/lib/marriage-counselor-api-security";
import { isMarriageStage2Enabled } from "@/lib/marriage-stage2-feature";
import { counselorAssignStage2EnrichmentReview } from "@/lib/marriage-session-review-workspace";
import { marriageStore } from "@/lib/stores/marriage-counseling-store";
import { isStage2EnrichmentSessionKey } from "@/lib/marriage-enrichment-session-keys";

export async function GET(request: Request) {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  const user = await getUserFromSession(token);
  if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  if (!isMarriageStage2Enabled()) {
    return NextResponse.json({ error: "Stage 2 is not enabled." }, { status: 404 });
  }

  const url = new URL(request.url);
  const journeyId = url.searchParams.get("journeyId")?.trim();
  if (!journeyId) return NextResponse.json({ error: "journeyId required." }, { status: 400 });

  try {
    const store = marriageStore();
    const reviews =
      typeof store.listSelfPacedSessionReviewsForJourney === "function"
        ? await store.listSelfPacedSessionReviewsForJourney(journeyId)
        : [];
    const enrichment = reviews.filter((r) => isStage2EnrichmentSessionKey(r.sessionKey));
    return NextResponse.json({ reviews: enrichment });
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
  if (!isMarriageStage2Enabled()) {
    return NextResponse.json({ error: "Stage 2 is not enabled." }, { status: 404 });
  }

  const body = await request.json();
  const action = String(body.action ?? "");
  try {
    if (action === "assign_module_review") {
      const review = await counselorAssignStage2EnrichmentReview(
        user,
        String(body.journeyId ?? ""),
        String(body.moduleId ?? ""),
      );
      return NextResponse.json({ ok: true, review });
    }
    return NextResponse.json({ error: "Unknown action." }, { status: 400 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Request failed.";
    return NextResponse.json(counselorRouteErrorBody(message), {
      status: counselorRouteErrorStatus(message),
    });
  }
}
