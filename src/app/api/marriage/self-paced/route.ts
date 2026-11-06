import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getUserFromSession, SESSION_COOKIE } from "@/lib/auth-server";
import { getActiveMarriageJourneyForUser } from "@/lib/marriage-counseling-server";
import {
  buildCoupleFeedbackCenterView,
  getCoupleSessionFeedbackDetail,
} from "@/lib/marriage-couple-feedback-server";
import {
  partnerViewPublishedFeedback,
  postClarificationMessage,
} from "@/lib/marriage-self-paced-server";
import { marriageStore } from "@/lib/stores/marriage-counseling-store";

export async function GET(request: Request) {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  const user = await getUserFromSession(token);
  if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });

  const url = new URL(request.url);
  const view = url.searchParams.get("view")?.trim();
  const journeyIdParam = url.searchParams.get("journeyId")?.trim();
  const sessionKey = url.searchParams.get("sessionKey")?.trim();

  try {
    const journey =
      journeyIdParam && (await marriageStore().getJourneyById(journeyIdParam))
        ? (await marriageStore().getJourneyById(journeyIdParam))!
        : await getActiveMarriageJourneyForUser(user);
    if (!journey) return NextResponse.json({ error: "No active journey." }, { status: 404 });

    if (view === "center") {
      return NextResponse.json(await buildCoupleFeedbackCenterView(user, journey));
    }
    if (sessionKey) {
      if (view === "session") {
        return NextResponse.json(await getCoupleSessionFeedbackDetail(user, journey, sessionKey));
      }
      const feedback = await partnerViewPublishedFeedback(user, journey.id, sessionKey);
      return NextResponse.json({ feedback });
    }
    return NextResponse.json({ error: "sessionKey or view=center required." }, { status: 400 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Request failed.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  const user = await getUserFromSession(token);
  if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });

  const body = await request.json();
  const action = String(body.action ?? "");
  if (action !== "post_clarification") {
    return NextResponse.json({ error: "Unknown action." }, { status: 400 });
  }

  try {
    let journeyId = String(body.journeyId ?? "").trim();
    if (!journeyId) {
      const journey = await getActiveMarriageJourneyForUser(user);
      if (!journey) throw new Error("No active journey.");
      journeyId = journey.id;
    }
    const message = await postClarificationMessage(
      user,
      journeyId,
      String(body.sessionKey ?? ""),
      String(body.body ?? ""),
    );
    return NextResponse.json({ ok: true, message });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Request failed.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
