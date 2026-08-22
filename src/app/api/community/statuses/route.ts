import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getUserFromSession, SESSION_COOKIE } from "@/lib/auth-server";
import { saveCommunityMedia } from "@/lib/community-media-server";
import {
  addCommunityStatus,
  deleteExpiredCommunityStatuses,
  getActiveCommunityStatuses,
} from "@/lib/community-status-server";

export async function GET() {
  await deleteExpiredCommunityStatuses();
  const statuses = await getActiveCommunityStatuses();
  return NextResponse.json({ statuses });
}

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  const user = await getUserFromSession(token);

  if (!user) {
    return NextResponse.json({ error: "Sign in to share a status." }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get("file");
  const caption = String(formData.get("caption") ?? "").trim();

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Photo or video is required." }, { status: 400 });
  }

  try {
    const { mediaUrl, mediaType } = await saveCommunityMedia(file);
    const status = await addCommunityStatus({
      id: `status-${Date.now()}`,
      authorId: user.id,
      authorName: user.name,
      mediaUrl,
      mediaType,
      caption: caption || undefined,
    });
    return NextResponse.json({ status }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Upload failed.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
