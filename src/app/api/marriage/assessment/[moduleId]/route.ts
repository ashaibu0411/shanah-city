import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getUserFromSession, SESSION_COOKIE } from "@/lib/auth-server";
import {
  getAssessmentForViewer,
  saveAssessmentDraft,
  submitAssessment,
} from "@/lib/marriage-counseling-server";

type Params = { params: Promise<{ moduleId: string }> };

export async function GET(_request: Request, { params }: Params) {
  const { moduleId } = await params;
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  const user = await getUserFromSession(token);
  if (!user) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }
  try {
    const data = await getAssessmentForViewer(user, moduleId);
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to load assessment." },
      { status: 400 },
    );
  }
}

export async function PATCH(request: Request, { params }: Params) {
  const { moduleId } = await params;
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  const user = await getUserFromSession(token);
  if (!user) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }
  const body = await request.json();
  try {
    const result = await saveAssessmentDraft(user, moduleId, body.answers ?? {});
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Save failed." },
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
  if (body.action !== "submit") {
    return NextResponse.json({ error: "Unknown action." }, { status: 400 });
  }
  try {
    const result = await submitAssessment(user, moduleId);
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Submit failed." },
      { status: 400 },
    );
  }
}
