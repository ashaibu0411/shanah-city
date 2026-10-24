import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getUserFromSession, SESSION_COOKIE } from "@/lib/auth-server";
import {
  assertCanManageDefaultPremaritalCounselorSetting,
  getDefaultPremaritalCounselorSettingForAdmin,
  updateDefaultPremaritalCounselorSetting,
} from "@/lib/marriage-default-premarital-counselor-server";

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  const user = await getUserFromSession(token);
  if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });

  try {
    await assertCanManageDefaultPremaritalCounselorSetting(user);
    const payload = await getDefaultPremaritalCounselorSettingForAdmin();
    return NextResponse.json(payload);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Not authorized." },
      { status: 403 },
    );
  }
}

export async function PATCH(request: Request) {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  const user = await getUserFromSession(token);
  if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });

  const body = await request.json();
  const counselorUserId =
    body.counselorUserId === null || body.counselorUserId === ""
      ? null
      : String(body.counselorUserId ?? "").trim() || null;

  try {
    const result = await updateDefaultPremaritalCounselorSetting(user, { counselorUserId });
    const payload = await getDefaultPremaritalCounselorSettingForAdmin();
    return NextResponse.json({ ...result, ...payload });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Update failed." },
      { status: 400 },
    );
  }
}
