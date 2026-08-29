import { cookies } from "next/headers";
import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextResponse } from "next/server";
import { getUserFromSession, SESSION_COOKIE } from "@/lib/auth-server";
import {
  COMMUNITY_IMAGE_CONTENT_TYPES,
  COMMUNITY_IMAGE_MAX_BYTES,
  COMMUNITY_VIDEO_CONTENT_TYPES,
  COMMUNITY_VIDEO_MAX_BYTES,
} from "@/lib/community-media-shared";

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
        if (!user) {
          throw new Error("Sign in to upload media.");
        }

        const isImagePath = pathname.startsWith("community/images/");
        const isVideoPath = pathname.startsWith("community/videos/");
        if (!isImagePath && !isVideoPath) {
          throw new Error("Invalid upload path.");
        }

        return {
          allowedContentTypes: isVideoPath
            ? [...COMMUNITY_VIDEO_CONTENT_TYPES]
            : [...COMMUNITY_IMAGE_CONTENT_TYPES],
          maximumSizeInBytes: isVideoPath ? COMMUNITY_VIDEO_MAX_BYTES : COMMUNITY_IMAGE_MAX_BYTES,
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
