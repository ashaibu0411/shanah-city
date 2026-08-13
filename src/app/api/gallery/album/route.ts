import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getUserFromSession, SESSION_COOKIE } from "@/lib/auth-server";
import {
  canUploadGallery,
  deleteGalleryAlbum,
  getGalleryAlbumCounts,
} from "@/lib/gallery-server";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE)?.value;
    const user = await getUserFromSession(token);

    if (!canUploadGallery(user, null)) {
      return NextResponse.json(
        { error: "Backend team access required." },
        { status: 403 },
      );
    }

    const albums = await getGalleryAlbumCounts();
    return NextResponse.json({ albums });
  } catch {
    return NextResponse.json({ error: "Could not load albums." }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE)?.value;
    const user = await getUserFromSession(token);

    const body = await request.json();
    const album = String(body.album ?? "").trim();
    const pin = String(body.pin ?? "");

    if (!canUploadGallery(user, pin)) {
      return NextResponse.json(
        { error: "Backend team access required. Sign in as team/leader or use the team PIN." },
        { status: 403 },
      );
    }

    if (!album) {
      return NextResponse.json({ error: "Album name is required." }, { status: 400 });
    }

    const result = await deleteGalleryAlbum(album);
    return NextResponse.json(result);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Could not delete album.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
