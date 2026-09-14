import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getUserFromSession, SESSION_COOKIE } from "@/lib/auth-server";
import { getPublicDisplayName } from "@/lib/member-display-name";
import { isAllowedCommunityMediaUrl } from "@/lib/community-media-shared";
import { saveCommunityMedia } from "@/lib/community-media-server";
import { attachReactionsToStatuses } from "@/lib/community-status-reaction-server";
import {
  loadCommunityStatusesForViewer,
  notifyStoryPosted,
} from "@/lib/community-status-viewer-server";
import { addCommunityStatus } from "@/lib/community-status-server";
import { defaultServiceInviteCaption } from "@/lib/community-worship-service";
import { normalizeStorySocialLink } from "@/lib/community-story-link-shared";
import type { CommunityStatusStoryKind } from "@/lib/member-types";

function parseStoryKind(value: unknown): CommunityStatusStoryKind {
  return value === "service_invite" ? "service_invite" : "default";
}

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE)?.value;
    const user = await getUserFromSession(token);
    const { statuses, priorityAuthorIds } = await loadCommunityStatusesForViewer(user?.id);
    return NextResponse.json({ statuses, priorityAuthorIds });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Stories are unavailable right now.";
    return NextResponse.json(
      { error: message, statuses: [], priorityAuthorIds: [] },
      { status: 503 },
    );
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
  let mediaType: "image" | "video" | "text" | "link" | "audio" | null = null;
  let caption = "";
  let storyKind: CommunityStatusStoryKind = "default";

  if (contentType.includes("application/json")) {
    const body = (await request.json()) as {
      mediaUrl?: string;
      mediaType?: "image" | "video" | "text" | "link" | "audio";
      caption?: string;
      storyKind?: CommunityStatusStoryKind;
      linkUrl?: string;
    };
    mediaUrl = String(body.mediaUrl ?? body.linkUrl ?? "").trim();
    storyKind = parseStoryKind(body.storyKind);
    caption = String(body.caption ?? "").trim();

    if (body.mediaType === "link") {
      try {
        const normalized = normalizeStorySocialLink(mediaUrl);
        mediaType = "link";
        mediaUrl = normalized.url;
        if (!caption) {
          caption = `Shared on ${normalized.label}`;
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : "Invalid link.";
        return NextResponse.json({ error: message }, { status: 400 });
      }
    } else if (body.mediaType === "text") {
      mediaType = "text";
      mediaUrl = "";
      if (!caption) {
        return NextResponse.json({ error: "Write something for your moment." }, { status: 400 });
      }
    } else {
      mediaType =
        body.mediaType === "video"
          ? "video"
          : body.mediaType === "audio"
            ? "audio"
            : body.mediaType === "image"
              ? "image"
              : null;
      if (!mediaUrl || !mediaType || !isAllowedCommunityMediaUrl(mediaUrl)) {
        return NextResponse.json({ error: "Photo or video is required." }, { status: 400 });
      }
    }

    if (storyKind === "service_invite" && !caption) {
      caption = defaultServiceInviteCaption();
    }
  } else {
    const formData = await request.formData();
    const file = formData.get("file");
    caption = String(formData.get("caption") ?? "").trim();
    storyKind = parseStoryKind(formData.get("storyKind"));

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
      id: `status-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      authorId: user.id,
      authorName: getPublicDisplayName(user),
      mediaUrl,
      mediaType: mediaType ?? "text",
      caption: caption || undefined,
      storyKind,
    });

    const [withReactions] = await attachReactionsToStatuses([status], user.id);

    void notifyStoryPosted({
      authorId: user.id,
      authorName: getPublicDisplayName(user),
      caption: caption || undefined,
    });

    return NextResponse.json({ status: withReactions }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not share story.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
