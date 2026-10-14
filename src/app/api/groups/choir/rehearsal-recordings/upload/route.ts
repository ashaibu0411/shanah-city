import { cookies } from "next/headers";
import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextResponse } from "next/server";
import { getUserFromSession, SESSION_COOKIE } from "@/lib/auth-server";
import {
  CHOIR_REHEARSAL_AUDIO_CONTENT_TYPES,
  CHOIR_REHEARSAL_RECORDING_MAX_BYTES,
} from "@/lib/choir-rehearsal-recording-types";
import { assertChoirRecordingMember } from "@/lib/choir-rehearsal-recording-server";
import { SHANAH_WORSHIP_GROUP_ID } from "@/lib/choir-group-constants";
import { isBlobConfigured } from "@/lib/use-blob";

const PATH_PREFIX = `groups/${SHANAH_WORSHIP_GROUP_ID}/rehearsal-recordings/`;

export async function GET() {
  return NextResponse.json({
    directUpload: isBlobConfigured(),
    maxBytes: CHOIR_REHEARSAL_RECORDING_MAX_BYTES,
    pathPrefix: PATH_PREFIX,
  });
}

export async function POST(request: Request) {
  if (!isBlobConfigured()) {
    return NextResponse.json(
      {
        error:
          "Long rehearsal uploads need cloud storage. Ask your admin to configure BLOB_READ_WRITE_TOKEN on Vercel.",
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
        if (!user) throw new Error("Sign in to upload recordings.");

        const access = await assertChoirRecordingMember(user, SHANAH_WORSHIP_GROUP_ID);
        if (!access.ok) throw new Error(access.error);

        if (!pathname.startsWith(PATH_PREFIX)) {
          throw new Error("Invalid upload path.");
        }

        return {
          allowedContentTypes: [...CHOIR_REHEARSAL_AUDIO_CONTENT_TYPES],
          maximumSizeInBytes: CHOIR_REHEARSAL_RECORDING_MAX_BYTES,
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
