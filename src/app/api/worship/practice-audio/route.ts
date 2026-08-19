import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getUserFromSession, SESSION_COOKIE } from "@/lib/auth-server";
import { saveWorshipPracticeStemFile } from "@/lib/worship-audio-server";
import { canManageWorshipPlan } from "@/lib/worship-access-server";

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  const user = await getUserFromSession(token);

  if (!user) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }

  if (!(await canManageWorshipPlan(user))) {
    return NextResponse.json({ error: "Worship leader access required." }, { status: 403 });
  }

  const formData = await request.formData();
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ error: "Choose an audio file to upload." }, { status: 400 });
  }

  try {
    const uploaded = await saveWorshipPracticeStemFile(file);
    return NextResponse.json({
      ...uploaded,
      uploadedAt: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not upload practice track." },
      { status: 400 },
    );
  }
}
