import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getUserFromSession, SESSION_COOKIE } from "@/lib/auth-server";
import { buildChoirHomeDashboard } from "@/lib/choir-dashboard-server";
import {
  CHOIR_PREPARATION_ITEMS,
  SHANAH_WORSHIP_GROUP_ID,
} from "@/lib/choir-group-constants";
import { setChoirPreparationChecked } from "@/lib/stores/choir-preparation-json";

export async function GET(request: Request) {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  const user = await getUserFromSession(token);

  if (!user) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }

  const groupId = new URL(request.url).searchParams.get("groupId")?.trim() ?? SHANAH_WORSHIP_GROUP_ID;
  const home = await buildChoirHomeDashboard(user, groupId);
  if (!home) {
    return NextResponse.json({ error: "Access denied." }, { status: 403 });
  }

  return NextResponse.json({ home });
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
  const groupId = String(body.groupId ?? SHANAH_WORSHIP_GROUP_ID).trim();

  if (groupId !== SHANAH_WORSHIP_GROUP_ID) {
    return NextResponse.json({ error: "Invalid group." }, { status: 400 });
  }

  const home = await buildChoirHomeDashboard(user, groupId);
  if (!home) {
    return NextResponse.json({ error: "Access denied." }, { status: 403 });
  }

  if (action === "preparation") {
    const planKey = String(body.planKey ?? "").trim();
    const itemId = String(body.itemId ?? "").trim();
    const checked = Boolean(body.checked);

    if (!planKey || planKey !== home.preparationPlanKey) {
      return NextResponse.json({ error: "Invalid plan." }, { status: 400 });
    }

    const allowed = CHOIR_PREPARATION_ITEMS.some((item) => item.id === itemId);
    if (!allowed) {
      return NextResponse.json({ error: "Invalid checklist item." }, { status: 400 });
    }

    const next = await setChoirPreparationChecked(user.id, planKey, itemId, checked);
    return NextResponse.json({ checked: next });
  }

  return NextResponse.json({ error: "Unknown action." }, { status: 400 });
}
