import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getUserFromSession, SESSION_COOKIE } from "@/lib/auth-server";
import {
  createCoupleCalendarEventForUser,
  deleteCoupleCalendarEventForUser,
  getCoupleCalendarForUser,
  updateCoupleCalendarEventForUser,
} from "@/lib/couple-calendar-server";

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  const user = await getUserFromSession(token);
  if (!user) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }

  try {
    const calendar = await getCoupleCalendarForUser(user);
    return NextResponse.json(calendar);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not load calendar." },
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
  const action = String(body.action ?? "create");

  try {
    if (action === "create") {
      const item = await createCoupleCalendarEventForUser(user, body);
      const calendar = await getCoupleCalendarForUser(user);
      return NextResponse.json({ item, ...calendar }, { status: 201 });
    }

    if (action === "update") {
      const eventId = String(body.eventId ?? "");
      const item = await updateCoupleCalendarEventForUser(user, eventId, body);
      const calendar = await getCoupleCalendarForUser(user);
      return NextResponse.json({ item, ...calendar });
    }

    if (action === "delete") {
      const eventId = String(body.eventId ?? "");
      await deleteCoupleCalendarEventForUser(user, eventId);
      const calendar = await getCoupleCalendarForUser(user);
      return NextResponse.json({ ok: true, ...calendar });
    }

    return NextResponse.json({ error: "Unknown action." }, { status: 400 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Something went wrong." },
      { status: 400 },
    );
  }
}
