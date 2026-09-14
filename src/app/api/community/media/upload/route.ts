import { cookies } from "next/headers";
import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextResponse } from "next/server";
import { getUserFromSession, SESSION_COOKIE } from "@/lib/auth-server";
import {
  COMMUNITY_AUDIO_CONTENT_TYPES,
  COMMUNITY_AUDIO_MAX_BYTES,
  COMMUNITY_IMAGE_CONTENT_TYPES,
  COMMUNITY_IMAGE_MAX_BYTES,
  COMMUNITY_VIDEO_CONTENT_TYPES,
  COMMUNITY_VIDEO_MAX_BYTES,
} from "@/lib/community-media-shared";
import { isBlobConfigured } from "@/lib/use-blob";

const COMMUNITY_MEDIA_FALLBACK_MAX_BYTES = 4 * 1024 * 1024;

export async function GET() {
  return NextResponse.json({
    directUpload: isBlobConfigured(),
    maxVideoBytes: COMMUNITY_VIDEO_MAX_BYTES,
    maxFallbackBytes: COMMUNITY_MEDIA_FALLBACK_MAX_BYTES,
  });
}

export async function POST(request: Request) {
  if (!isBlobConfigured()) {
    return NextResponse.json(
      {
        error:
          "Video storage is not configured on the server. The church team needs to add BLOB_READ_WRITE_TOKEN in Vercel.",
      },
      { status: 503 },
    );
  }

  const body = (await request.json()) as HandleUploadBody;

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname) => {
        const cookieStore = await cookies();
        const token = cookieStore.get(SESSION_COOKIE)?.value;
        const user = await getUserFromSession(token);
        if (!user) {
          throw new Error("Sign in to upload media.");
        }

        const isImagePath = pathname.startsWith("community/images/");
        const isVideoPath = pathname.startsWith("community/videos/");
        const isAudioPath = pathname.startsWith("community/audio/");
        if (!isImagePath && !isVideoPath && !isAudioPath) {
          throw new Error("Invalid upload path.");
        }

        return {
          allowedContentTypes: isVideoPath
            ? [...COMMUNITY_VIDEO_CONTENT_TYPES]
            : isAudioPath
              ? [...COMMUNITY_AUDIO_CONTENT_TYPES]
              : [...COMMUNITY_IMAGE_CONTENT_TYPES],
          maximumSizeInBytes: isVideoPath
            ? COMMUNITY_VIDEO_MAX_BYTES
            : isAudioPath
              ? COMMUNITY_AUDIO_MAX_BYTES
              : COMMUNITY_IMAGE_MAX_BYTES,
          addRandomSuffix: false,
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
