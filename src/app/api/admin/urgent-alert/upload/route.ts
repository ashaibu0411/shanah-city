import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { canManageAsAdmin } from "@/lib/admin-access-server";
import { getUserFromSession, SESSION_COOKIE } from "@/lib/auth-server";
import {
  saveUrgentAlertImage,
  saveUrgentAlertVideo,
} from "@/lib/urgent-alert-media-server";

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  const user = await getUserFromSession(token);

  if (!user || !(await canManageAsAdmin(user))) {
    return NextResponse.json({ error: "Admin access required." }, { status: 403 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file");
    const kind = String(formData.get("kind") ?? "").trim();

    if (!(file instanceof File) || file.size === 0) {
      return NextResponse.json({ error: "Choose a file to upload." }, { status: 400 });
    }

    const url =
      kind === "video"
        ? await saveUrgentAlertVideo(file)
        : kind === "image"
          ? await saveUrgentAlertImage(file)
          : null;

    if (!url) {
      return NextResponse.json({ error: "Upload kind must be image or video." }, { status: 400 });
    }

    return NextResponse.json({
      url,
      kind,
      fileName: file.name,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Upload failed." },
      { status: 400 },
    );
  }
}
