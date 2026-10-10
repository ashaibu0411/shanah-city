import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getUserFromSession, SESSION_COOKIE } from "@/lib/auth-server";
import {
  advanceKnowSpouseQuestionForUser,
  consentKnowSpouseRevealForUser,
  getKnowSpouseGameForUser,
  submitKnowSpouseAnswerForUser,
} from "@/lib/couple-game-state-server";

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  const user = await getUserFromSession(token);
  if (!user) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }

  try {
    const data = await getKnowSpouseGameForUser(user);
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not load game." },
      { status: 403 },
    );
  }
}

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  const user = await getUserFromSession(token);
  if (!user) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }

  const body = await request.json();
  const action = String(body.action ?? "");

  try {
    if (action === "knowSpouseSubmit") {
      const result = await submitKnowSpouseAnswerForUser(user, String(body.answer ?? ""));
      return NextResponse.json(result);
    }
    if (action === "knowSpouseConsent") {
      const result = await consentKnowSpouseRevealForUser(user);
      return NextResponse.json(result);
    }
    if (action === "knowSpouseNext") {
      const result = await advanceKnowSpouseQuestionForUser(user);
      return NextResponse.json(result);
    }
    return NextResponse.json({ error: "Unknown action." }, { status: 400 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Something went wrong." },
      { status: 400 },
    );
  }
}
