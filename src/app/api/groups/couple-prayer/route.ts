import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getUserFromSession, SESSION_COOKIE } from "@/lib/auth-server";
import {
  createCouplePrayerPostForUser,
  getCouplePrayerFeed,
} from "@/lib/couple-prayer-server";

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  const user = await getUserFromSession(token);

  try {
    const feed = await getCouplePrayerFeed(user);
    return NextResponse.json(feed);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not load prayer wall." },
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
  const type = body.type === "praise" ? "praise" : "prayer";

  try {
    const post = await createCouplePrayerPostForUser(user, {
      content: String(body.content ?? ""),
      type,
    });
    const feed = await getCouplePrayerFeed(user);
    return NextResponse.json({ post, ...feed }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not post." },
      { status: 400 },
    );
  }
}
