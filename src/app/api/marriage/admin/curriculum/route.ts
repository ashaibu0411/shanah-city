import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getUserFromSession, SESSION_COOKIE } from "@/lib/auth-server";
import {
  archiveCurriculumVersion,
  getCurriculumAdminSnapshot,
  previewComparisonForAdmin,
  publishCurriculumDraft,
  saveCurriculumDraft,
} from "@/lib/marriage-curriculum-admin-server";

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  const user = await getUserFromSession(token);
  if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  try {
    const snapshot = await getCurriculumAdminSnapshot(user);
    return NextResponse.json(snapshot);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Access denied." },
      { status: 403 },
    );
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
    if (action === "save_draft") {
      const draft = await saveCurriculumDraft(user, {
        id: body.id ? String(body.id) : undefined,
        version: String(body.version ?? ""),
        modules: body.modules ?? [],
        basedOnVersion: body.basedOnVersion ? String(body.basedOnVersion) : undefined,
      });
      return NextResponse.json({ ok: true, draft });
    }
    if (action === "publish") {
      const published = await publishCurriculumDraft(user, String(body.draftId ?? ""));
      return NextResponse.json({ ok: true, published });
    }
    if (action === "archive") {
      const archived = await archiveCurriculumVersion(user, String(body.versionId ?? ""));
      return NextResponse.json({ ok: true, archived });
    }
    if (action === "preview_compare") {
      const preview = await previewComparisonForAdmin(
        user,
        String(body.moduleId ?? ""),
        body.answerA ?? {},
        body.answerB ?? {},
      );
      return NextResponse.json({ ok: true, preview });
    }
    return NextResponse.json({ error: "Unknown action." }, { status: 400 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Request failed." },
      { status: 400 },
    );
  }
}
