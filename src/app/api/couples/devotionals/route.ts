import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getUserFromSession, SESSION_COOKIE } from "@/lib/auth-server";
import {
  getCoupleMarriageDevotionalsForUser,
  markCoupleMarriageDevotionalReadForUser,
  publishCoupleMarriageDevotionalForUser,
  updateCoupleMarriageDevotionalForUser,
} from "@/lib/couple-marriage-devotional-server";

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  const user = await getUserFromSession(token);
  if (!user) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }

  try {
    const data = await getCoupleMarriageDevotionalsForUser(user);
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not load devotionals." },
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
  const action = String(body.action ?? "markRead");

  try {
    if (action === "markRead") {
      const devotionalId = String(body.devotionalId ?? "");
      const result = await markCoupleMarriageDevotionalReadForUser(user, devotionalId);
      return NextResponse.json(result);
    }

    if (action === "publish") {
      const result = await publishCoupleMarriageDevotionalForUser(user, body);
      return NextResponse.json(result, { status: 201 });
    }

    if (action === "update") {
      const devotionalId = String(body.devotionalId ?? "");
      const result = await updateCoupleMarriageDevotionalForUser(user, devotionalId, body);
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
