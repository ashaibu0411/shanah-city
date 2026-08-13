import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getUserFromSession, SESSION_COOKIE } from "@/lib/auth-server";
import {
  canViewGalleryDownloadLog,
  getGalleryDownloadLog,
} from "@/lib/gallery-server";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE)?.value;
    const user = await getUserFromSession(token);

    if (!canViewGalleryDownloadLog(user)) {
      return NextResponse.json(
        { error: "Backend team access required." },
        { status: 403 },
      );
    }

    const downloads = await getGalleryDownloadLog(200);
    return NextResponse.json({ downloads });
  } catch {
    return NextResponse.json({ error: "Could not load download log." }, { status: 500 });
  }
}
