import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getUserFromSession, SESSION_COOKIE } from "@/lib/auth-server";
import {
  getGalleryPhotoById,
  guessContentType,
  guessDownloadFilename,
  logGalleryDownload,
  resolvePhotoFilePath,
} from "@/lib/gallery-server";
import { photoUsePolicyVersion } from "@/lib/photo-use-policy";
import { isMembersOnlyGalleryPhoto } from "@/lib/gallery-types";
import {
  getExternalPhotoUrl,
  isBlobPhotoUrl,
  isExternalPhotoUrl,
} from "@/lib/gallery-utils";
import { promises as fs } from "fs";

export async function GET(request: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE)?.value;
    const user = await getUserFromSession(token);

    const { searchParams } = new URL(request.url);
    const photoId = searchParams.get("id");
    const inline = searchParams.get("inline") === "1";
    const agreed = searchParams.get("agreed") === "1";

    if (!photoId) {
      return NextResponse.json({ error: "Photo id required." }, { status: 400 });
    }

    const photo = await getGalleryPhotoById(photoId);
    if (!photo) {
      return NextResponse.json({ error: "Photo not found." }, { status: 404 });
    }

    const membersOnly = isMembersOnlyGalleryPhoto(photo);

    if (!user && membersOnly) {
      return NextResponse.json(
        { error: "Sign in to view this photo." },
        { status: 401 },
      );
    }

    if (!inline && !user) {
      return NextResponse.json(
        { error: "Sign in to download photos." },
        { status: 401 },
      );
    }

    if (!inline && !agreed) {
      return NextResponse.json(
        { error: "Accept the photo use policy before downloading." },
        { status: 403 },
      );
    }

    if (isExternalPhotoUrl(photo.url)) {
      if (!inline) {
        await logGalleryDownload(photo, user!, true, photoUsePolicyVersion);
      }
      return NextResponse.redirect(getExternalPhotoUrl(photo.url));
    }

    let buffer: Buffer;
    let contentType: string;
    let filename: string;

    if (isBlobPhotoUrl(photo.url)) {
      const response = await fetch(photo.url);
      if (!response.ok) {
        return NextResponse.json({ error: "Photo file not found." }, { status: 404 });
      }
      buffer = Buffer.from(await response.arrayBuffer());
      contentType =
        response.headers.get("content-type") ??
        guessContentType(new URL(photo.url).pathname);
      filename = guessDownloadFilename(photo, new URL(photo.url).pathname);
    } else {
      const filepath = await resolvePhotoFilePath(photo);

      try {
        await fs.access(filepath);
      } catch {
        return NextResponse.json({ error: "Photo file not found." }, { status: 404 });
      }

      buffer = await fs.readFile(filepath);
      contentType = guessContentType(filepath);
      filename = guessDownloadFilename(photo, filepath);
    }

    if (!inline) {
      await logGalleryDownload(photo, user!, true, photoUsePolicyVersion);
    }

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": inline
          ? "inline"
          : `attachment; filename="${filename}"`,
        "Cache-Control": "private, no-store",
      },
    });
  } catch {
    return NextResponse.json({ error: "Download failed." }, { status: 500 });
  }
}
