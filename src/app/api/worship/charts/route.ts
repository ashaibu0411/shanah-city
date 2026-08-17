import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { canManageWorshipPlan } from "@/lib/worship-access-server";
import { saveWorshipChartFile } from "@/lib/worship-chart-server";
import { getUserFromSession, SESSION_COOKIE } from "@/lib/auth-server";

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
    return NextResponse.json({ error: "Choose a chart file to upload." }, { status: 400 });
  }

  try {
    const uploaded = await saveWorshipChartFile(file);
    return NextResponse.json(uploaded);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not upload chart." },
      { status: 400 },
    );
  }
}
