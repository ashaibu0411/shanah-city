import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getUserFromSession, SESSION_COOKIE } from "@/lib/auth-server";
import {
  grantCounselorAnswerConsent,
  listCounselorConsentStatusForModule,
  revokeCounselorAnswerConsent,
} from "@/lib/marriage-counselor-consent-participant";

type Params = { params: Promise<{ moduleId: string }> };

export async function GET(request: Request, { params }: Params) {
  const { moduleId } = await params;
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  const user = await getUserFromSession(token);
  if (!user) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }

  const url = new URL(request.url);
  const journeyId = url.searchParams.get("journeyId")?.trim() ?? "";
  if (!journeyId) {
    return NextResponse.json({ error: "journeyId is required." }, { status: 400 });
  }

  try {
    const status = await listCounselorConsentStatusForModule(user, journeyId, moduleId);
    return NextResponse.json(status);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to load consent status." },
      { status: 400 },
    );
  }
}

export async function POST(request: Request, { params }: Params) {
  const { moduleId } = await params;
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  const user = await getUserFromSession(token);
  if (!user) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }

  const body = await request.json();
  const journeyId = String(body.journeyId ?? "").trim();
  const questionId = String(body.questionId ?? "").trim();
  const action = String(body.action ?? "");

  if (!journeyId || !questionId) {
    return NextResponse.json({ error: "journeyId and questionId are required." }, { status: 400 });
  }

  try {
    if (action === "grant") {
      const answerFingerprint = String(body.answerFingerprint ?? "").trim();
      const answerGenerationRaw = body.answerGeneration;
      const answerGeneration =
        typeof answerGenerationRaw === "number"
          ? answerGenerationRaw
          : Number.parseInt(String(answerGenerationRaw ?? ""), 10);
      const result = await grantCounselorAnswerConsent(user, journeyId, moduleId, questionId, {
        answerFingerprint,
        answerGeneration,
      });
      const status = await listCounselorConsentStatusForModule(user, journeyId, moduleId);
      return NextResponse.json({ ...result, ok: true, status });
    }
    if (action === "revoke") {
      const result = await revokeCounselorAnswerConsent(user, journeyId, moduleId, questionId);
      const status = await listCounselorConsentStatusForModule(user, journeyId, moduleId);
      return NextResponse.json({ ...result, ok: true, status });
    }
    return NextResponse.json({ error: "Unknown action." }, { status: 400 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Request failed." },
      { status: 400 },
    );
  }
}
