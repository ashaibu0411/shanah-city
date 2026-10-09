import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getUserFromSession, SESSION_COOKIE } from "@/lib/auth-server";
import {
  createCouplePrayerJournalEntryForUser,
  deleteCouplePrayerJournalEntryForUser,
  getCouplePrayerJournalForUser,
  updateCouplePrayerJournalEntryForUser,
} from "@/lib/couple-prayer-journal-server";

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  const user = await getUserFromSession(token);
  if (!user) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }

  try {
    const data = await getCouplePrayerJournalForUser(user);
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not load journal." },
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
      const result = await createCouplePrayerJournalEntryForUser(user, body);
      return NextResponse.json(result, { status: 201 });
    }

    const entryId = String(body.entryId ?? "");

    if (action === "update") {
      const result = await updateCouplePrayerJournalEntryForUser(user, entryId, body);
      return NextResponse.json(result);
    }

    if (action === "delete") {
      const result = await deleteCouplePrayerJournalEntryForUser(user, entryId);
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
