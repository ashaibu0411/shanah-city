import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getUserFromSession, SESSION_COOKIE } from "@/lib/auth-server";
import {
  partnerViewPublishedFeedback,
  postClarificationMessage,
} from "@/lib/marriage-self-paced-server";

export async function GET(request: Request) {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  const user = await getUserFromSession(token);
  if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });

  const url = new URL(request.url);
  const journeyId = url.searchParams.get("journeyId")?.trim();
  const sessionKey = url.searchParams.get("sessionKey")?.trim();
  if (!journeyId || !sessionKey) {
    return NextResponse.json({ error: "journeyId and sessionKey required." }, { status: 400 });
  }

  try {
    const feedback = await partnerViewPublishedFeedback(user, journeyId, sessionKey);
    return NextResponse.json({ feedback });
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
    const message = await postClarificationMessage(
      user,
      String(body.journeyId ?? ""),
      String(body.sessionKey ?? ""),
      String(body.body ?? ""),
    );
    return NextResponse.json({ ok: true, message });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Request failed.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
