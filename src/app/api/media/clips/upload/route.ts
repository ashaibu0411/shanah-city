import { cookies } from "next/headers";
import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextResponse } from "next/server";
import { getUserFromSession, SESSION_COOKIE } from "@/lib/auth-server";
import { canPublishMediaClips } from "@/lib/group-permissions-server";
import {
  MEDIA_CLIP_IMAGE_CONTENT_TYPES,
  MEDIA_CLIP_MAX_BYTES,
  MEDIA_CLIP_VIDEO_CONTENT_TYPES,
} from "@/lib/media-clip-video-server";

export async function POST(request: Request) {
  const body = (await request.json()) as HandleUploadBody;

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname) => {
        const cookieStore = await cookies();
        const token = cookieStore.get(SESSION_COOKIE)?.value;
        const user = await getUserFromSession(token);
        if (!(await canPublishMediaClips(user))) {
          throw new Error("Only media team members or Admin Group can upload short videos.");
        }
        if (!pathname.startsWith("media/clips/")) {
          throw new Error("Invalid upload path.");
        }
        return {
          allowedContentTypes: [
            ...MEDIA_CLIP_VIDEO_CONTENT_TYPES,
            ...MEDIA_CLIP_IMAGE_CONTENT_TYPES,
          ],
          maximumSizeInBytes: MEDIA_CLIP_MAX_BYTES,
          addRandomSuffix: true,
        };
      },
    });

    return NextResponse.json(jsonResponse);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not start upload." },
      { status: 400 },
    );
  }
}
