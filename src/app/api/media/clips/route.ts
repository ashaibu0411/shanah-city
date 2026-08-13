import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getUserFromSession, SESSION_COOKIE } from "@/lib/auth-server";
import { hasMediaRole } from "@/lib/gallery-permissions";
import { parseYouTubeVideoId } from "@/lib/media-clips-utils";
import { listMediaClips, publishYouTubeClip } from "@/lib/media-clips-server";
import { notifyNewMediaClip } from "@/lib/push-server";

function canPublishClips(user: { role?: string } | null) {
  return hasMediaRole(user) || user?.role === "leader";
}

export async function GET() {
  const clips = await listMediaClips();
  return NextResponse.json({ clips });
}

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  const user = await getUserFromSession(token);

  if (!user) {
    return NextResponse.json({ error: "Sign in to publish clips." }, { status: 401 });
  }

  if (!canPublishClips(user)) {
    return NextResponse.json(
      { error: "Only media team members or leaders can publish short videos." },
      { status: 403 },
    );
  }

  try {
    const body = await request.json();
    const title = String(body.title ?? "").trim();
    const source = String(body.url ?? body.videoId ?? "").trim();
    const videoId = parseYouTubeVideoId(source);

    if (!title) {
      return NextResponse.json({ error: "Title is required." }, { status: 400 });
    }

    if (!videoId) {
      return NextResponse.json(
        { error: "Paste a valid YouTube Shorts link or 11-character video ID." },
        { status: 400 },
      );
    }

    const clip = await publishYouTubeClip({ title, videoId });
    await notifyNewMediaClip({
      authorId: user.id,
      title: clip.title,
    });

    return NextResponse.json({ clip }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not publish clip." },
      { status: 400 },
    );
  }
}
