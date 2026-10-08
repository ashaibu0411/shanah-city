import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getUserFromSession, SESSION_COOKIE } from "@/lib/auth-server";
import {
  deleteCoupleLoveNoteForUser,
  getCoupleLoveNotesForUser,
  markCoupleLoveNoteReadForUser,
  sendCoupleLoveNoteForUser,
} from "@/lib/couple-love-note-server";

export async function GET(request: Request) {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  const user = await getUserFromSession(token);
  if (!user) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") ?? undefined;
  const filter = searchParams.get("filter") ?? undefined;

  try {
    const data = await getCoupleLoveNotesForUser(user, { q, filter });
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not load love notes." },
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
  const action = String(body.action ?? "send");

  try {
    if (action === "send") {
      const result = await sendCoupleLoveNoteForUser(user, body);
      return NextResponse.json(result, { status: 201 });
    }

    if (action === "markRead") {
      const noteId = String(body.noteId ?? "");
      const result = await markCoupleLoveNoteReadForUser(user, noteId);
      return NextResponse.json(result);
    }

    if (action === "delete") {
      const noteId = String(body.noteId ?? "");
      const result = await deleteCoupleLoveNoteForUser(user, noteId);
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
