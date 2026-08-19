import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { getUserFromSession, SESSION_COOKIE } from "@/lib/auth-server";
import { canPublishMediaClips } from "@/lib/group-permissions-server";
import { parseYouTubeVideoId } from "@/lib/media-clips-utils";
import {
  listMediaClips,
  publishUploadedClip,
  publishYouTubeClip,
} from "@/lib/media-clips-server";
import {
  isAllowedMediaClipImage,
  isAllowedMediaClipVideo,
  saveMediaClipPosterFile,
  saveMediaClipVideoFile,
} from "@/lib/media-clip-video-server";
import { notifyNewMediaClip } from "@/lib/push-server";
import type { MediaClip } from "@/lib/types";

async function requirePublisher() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  const user = await getUserFromSession(token);

  if (!user) {
    return { error: NextResponse.json({ error: "Sign in to publish clips." }, { status: 401 }) };
  }

  if (!(await canPublishMediaClips(user))) {
    return {
      error: NextResponse.json(
        { error: "Only media team members or Admin Group can publish short videos." },
        { status: 403 },
      ),
    };
  }

  return { user };
}

async function finishPublish(clip: MediaClip, authorId: string) {
  await notifyNewMediaClip({
    authorId,
    title: clip.title,
  });
  revalidatePath("/live");
  return NextResponse.json({ clip }, { status: 201 });
}

export async function GET() {
  const clips = await listMediaClips();
  return NextResponse.json({ clips });
}

export async function POST(request: Request) {
  const access = await requirePublisher();
  if ("error" in access && access.error) return access.error;
  const user = access.user!;

  try {
    const contentType = request.headers.get("content-type") ?? "";

    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      const title = String(formData.get("title") ?? "").trim();
      const file = formData.get("file");
      const poster = formData.get("poster");

      if (!title) {
        return NextResponse.json({ error: "Title is required." }, { status: 400 });
      }
      if (!(file instanceof File) || file.size === 0) {
        return NextResponse.json({ error: "Choose a short video to upload." }, { status: 400 });
      }
      if (!isAllowedMediaClipVideo(file)) {
        return NextResponse.json(
          { error: "Upload an MP4, MOV, or WEBM short under 80 MB." },
          { status: 400 },
        );
      }

      const url = await saveMediaClipVideoFile(file);
      let thumbnail: string | undefined;
      if (poster instanceof File && poster.size > 0 && isAllowedMediaClipImage(poster)) {
        thumbnail = await saveMediaClipPosterFile(poster);
      }

      const clip = await publishUploadedClip({ title, url, thumbnail });
      return finishPublish(clip, user.id);
    }

    const body = await request.json();
    const title = String(body.title ?? "").trim();
    const source = String(body.url ?? body.videoId ?? "").trim();
    const thumbnail = body.thumbnail ? String(body.thumbnail).trim() : undefined;
    const platform = String(body.platform ?? "").trim();

    if (!title) {
      return NextResponse.json({ error: "Title is required." }, { status: 400 });
    }

    if (platform === "upload") {
      if (!source) {
        return NextResponse.json({ error: "Uploaded video URL is required." }, { status: 400 });
      }
      const clip = await publishUploadedClip({ title, url: source, thumbnail });
      return finishPublish(clip, user.id);
    }

    const videoId = parseYouTubeVideoId(source);
    if (!videoId) {
      return NextResponse.json(
        { error: "Paste a valid YouTube Shorts link or upload a video file." },
        { status: 400 },
      );
    }

    const clip = await publishYouTubeClip({ title, videoId });
    return finishPublish(clip, user.id);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not publish clip." },
      { status: 400 },
    );
  }
}
