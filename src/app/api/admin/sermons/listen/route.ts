import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { canManageAsAdmin } from "@/lib/admin-access-server";
import { getUserFromSession, SESSION_COOKIE } from "@/lib/auth-server";
import { parseYouTubeVideoId } from "@/lib/media-clips-utils";
import { saveSermonAudioFile } from "@/lib/sermon-audio-server";
import { invalidateSermonAudioOverrideCache } from "@/lib/sermon-audio-playback-server";
import {
  listSermonListenRecords,
  upsertSermonListenRecord,
} from "@/lib/stores/sermon-listen-db";
import { loadChannelSermons } from "@/lib/youtube-sermons-server";

export const runtime = "nodejs";

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  const user = await getUserFromSession(token);

  if (!(await canManageAsAdmin(user))) {
    return NextResponse.json({ error: "Admin access required." }, { status: 403 });
  }

  const [published, latestVideos] = await Promise.all([
    listSermonListenRecords(),
    loadChannelSermons(8),
  ]);

  return NextResponse.json({
    published,
    latestVideos,
  });
}

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  const user = await getUserFromSession(token);

  if (!(await canManageAsAdmin(user))) {
    return NextResponse.json({ error: "Admin access required." }, { status: 403 });
  }

  try {
    const formData = await request.formData();
    const youtubeInput = String(formData.get("youtubeUrl") ?? formData.get("youtubeVideoId") ?? "").trim();
    const title = String(formData.get("title") ?? "").trim();
    const file = formData.get("file");

    const videoId = parseYouTubeVideoId(youtubeInput);
    if (!videoId) {
      return NextResponse.json(
        { error: "Paste a valid YouTube link or 11-character video ID." },
        { status: 400 },
      );
    }

    if (!(file instanceof File) || file.size === 0) {
      return NextResponse.json({ error: "Choose an MP3 or M4A for Listen mode." }, { status: 400 });
    }

    const uploaded = await saveSermonAudioFile(file);
    const record = await upsertSermonListenRecord({
      youtubeVideoId: videoId,
      title: title || undefined,
      audioUrl: uploaded.url,
      audioFileName: uploaded.fileName,
      uploadedById: user!.id,
      uploadedByName: user!.name,
    });

    invalidateSermonAudioOverrideCache();

    return NextResponse.json(
      {
        ok: true,
        record,
        message: "Listen is live for this message. Members can tap Listen on the home screen and sermons page.",
      },
      { status: 201 },
    );
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Publish failed." },
      { status: 400 },
    );
  }
}
