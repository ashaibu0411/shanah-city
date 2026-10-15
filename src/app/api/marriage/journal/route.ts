import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getUserFromSession, SESSION_COOKIE } from "@/lib/auth-server";
import { addJournalEntry, listJournal } from "@/lib/marriage-counseling-server";

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  const user = await getUserFromSession(token);
  if (!user) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }
  const entries = await listJournal(user);
  return NextResponse.json({ entries });
}

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  const user = await getUserFromSession(token);
  if (!user) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }
  const body = await request.json();
  try {
    const entry = await addJournalEntry(user, {
      visibility: body.visibility === "private" ? "private" : "shared",
      kind: body.kind ?? "reflection",
      body: String(body.body ?? ""),
      moduleId: body.moduleId ? String(body.moduleId) : undefined,
    });
    return NextResponse.json({ ok: true, entry });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not save entry." },
      { status: 400 },
    );
  }
}
