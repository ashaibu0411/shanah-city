import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { canManageWorshipPlan } from "@/lib/worship-access-server";
import {
  deleteWorshipLibrarySong,
  listWorshipLibrarySongs,
  saveWorshipLibrarySong,
} from "@/lib/worship-song-library-server";
import { getUserFromSession, SESSION_COOKIE } from "@/lib/auth-server";

async function requireWorshipLeader() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  const user = await getUserFromSession(token);

  if (!user) {
    return { error: NextResponse.json({ error: "Sign in required." }, { status: 401 }) };
  }

  if (!(await canManageWorshipPlan(user))) {
    return { error: NextResponse.json({ error: "Worship leader access required." }, { status: 403 }) };
  }

  return { user };
}

export async function GET(request: Request) {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  const user = await getUserFromSession(token);
  if (!user) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q") ?? undefined;
  const songs = await listWorshipLibrarySongs(query);
  return NextResponse.json({ songs });
}

export async function POST(request: Request) {
  const auth = await requireWorshipLeader();
  if (auth.error) return auth.error;

  const body = await request.json();
  const action = String(body.action ?? "save");

  if (action === "delete") {
    const id = String(body.id ?? "");
    const removed = await deleteWorshipLibrarySong(id);
    if (!removed) {
      return NextResponse.json({ error: "Song not found." }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  }

  const title = String(body.title ?? "").trim();
  if (!title) {
    return NextResponse.json({ error: "Song title is required." }, { status: 400 });
  }

  const song = await saveWorshipLibrarySong({
    id: body.id ? String(body.id) : undefined,
    title,
    artist: body.artist ? String(body.artist).trim() : undefined,
    defaultKey: String(body.defaultKey ?? "C").trim() || "C",
    bpm: body.bpm ? Number(body.bpm) : undefined,
    ccliNumber: body.ccliNumber ? String(body.ccliNumber).trim() : undefined,
    chartUrl: body.chartUrl ? String(body.chartUrl).trim() : undefined,
    chartFileName: body.chartFileName ? String(body.chartFileName).trim() : undefined,
    notes: body.notes ? String(body.notes).trim() : undefined,
    tags: Array.isArray(body.tags)
      ? body.tags.map((tag: unknown) => String(tag).trim()).filter(Boolean)
      : undefined,
    actor: { id: auth.user!.id, name: auth.user!.name },
  });

  return NextResponse.json({ song });
}
