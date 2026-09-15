import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { AVATAR_MAX_BYTES } from "@/lib/avatar-image";
import { getUserFromSession, SESSION_COOKIE } from "@/lib/auth-server";
import { isBlobConfigured } from "@/lib/use-blob";

const AVATAR_PATH = /^avatars\/([^/]+)\.(jpe?g|png|webp|gif)$/i;

export async function GET() {
  return NextResponse.json({
    directUpload: isBlobConfigured(),
    maxBytes: AVATAR_MAX_BYTES,
  });
}

export async function POST(request: Request) {
  if (!isBlobConfigured()) {
    return NextResponse.json(
      {
        error:
          "Profile photo storage is not configured. Add BLOB_READ_WRITE_TOKEN in Vercel (Production), then redeploy.",
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
          throw new Error("Sign in to upload a profile photo.");
        }

        const match = pathname.match(AVATAR_PATH);
        if (!match || match[1] !== user.id) {
          throw new Error("Invalid profile photo path.");
        }

        return {
          allowedContentTypes: ["image/jpeg", "image/png", "image/webp", "image/gif"],
          maximumSizeInBytes: AVATAR_MAX_BYTES,
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
