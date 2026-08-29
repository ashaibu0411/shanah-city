import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getUserFromSession, SESSION_COOKIE } from "@/lib/auth-server";
import { isAllowedCommunityMediaUrl } from "@/lib/community-media-shared";
import { saveCommunityMedia } from "@/lib/community-media-server";
import {
  addCommunityStatus,
  deleteExpiredCommunityStatuses,
  getActiveCommunityStatuses,
} from "@/lib/community-status-server";

export async function GET() {
  try {
    await deleteExpiredCommunityStatuses();
    const statuses = await getActiveCommunityStatuses();
    return NextResponse.json({ statuses });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Stories are unavailable right now.";
    return NextResponse.json({ error: message, statuses: [] }, { status: 503 });
  }
}

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  const user = await getUserFromSession(token);

  if (!user) {
    return NextResponse.json({ error: "Sign in to share a status." }, { status: 401 });
  }

  const contentType = request.headers.get("content-type") ?? "";
  let mediaUrl = "";
  let mediaType: "image" | "video" | null = null;
  let caption = "";

  if (contentType.includes("application/json")) {
    const body = (await request.json()) as {
      mediaUrl?: string;
      mediaType?: "image" | "video";
      caption?: string;
    };
    mediaUrl = String(body.mediaUrl ?? "").trim();
    mediaType = body.mediaType === "video" ? "video" : body.mediaType === "image" ? "image" : null;
    caption = String(body.caption ?? "").trim();
    if (!mediaUrl || !mediaType || !isAllowedCommunityMediaUrl(mediaUrl)) {
      return NextResponse.json({ error: "Photo or video is required." }, { status: 400 });
    }
  } else {
    const formData = await request.formData();
    const file = formData.get("file");
    caption = String(formData.get("caption") ?? "").trim();

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Photo or video is required." }, { status: 400 });
    }

    try {
      const saved = await saveCommunityMedia(file);
      mediaUrl = saved.mediaUrl;
      mediaType = saved.mediaType;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Upload failed.";
      return NextResponse.json({ error: message }, { status: 400 });
    }
  }

  try {
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
    const message = error instanceof Error ? error.message : "Could not share story.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
