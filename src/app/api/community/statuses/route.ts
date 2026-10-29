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
import { assertTrackAttachable } from "@/lib/story-music/story-music-service";
import { defaultServiceInviteCaption } from "@/lib/community-worship-service";
import { normalizeStorySocialLink } from "@/lib/community-story-link-shared";
import {
  assertCanPostGroupCommunityStory,
  groupStoryAuthorId,
} from "@/lib/group-community-story-server";
import type { CommunityStatusMusic, CommunityStatusStoryKind } from "@/lib/member-types";
import { notifyMemberMentions } from "@/lib/mention-notify-server";

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
  let groupId = "";
  let musicTrackId = "";
  let memberStoryAudioUrl = "";
  let memberAudioRightsAck = false;

  if (contentType.includes("application/json")) {
    const body = (await request.json()) as {
      mediaUrl?: string;
      mediaType?: "image" | "video" | "text" | "link" | "audio";
      caption?: string;
      storyKind?: CommunityStatusStoryKind;
      linkUrl?: string;
      groupId?: string;
      musicTrackId?: string;
      memberStoryAudioUrl?: string;
      memberAudioRightsAck?: boolean;
    };
    groupId = String(body.groupId ?? "").trim();
    musicTrackId = String(body.musicTrackId ?? "").trim();
    memberStoryAudioUrl = String(body.memberStoryAudioUrl ?? "").trim();
    memberAudioRightsAck = Boolean(body.memberAudioRightsAck);
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
    groupId = String(formData.get("groupId") ?? "").trim();
    musicTrackId = String(formData.get("musicTrackId") ?? "").trim();
    memberStoryAudioUrl = String(formData.get("memberStoryAudioUrl") ?? "").trim();
    memberAudioRightsAck = formData.get("memberAudioRightsAck") === "true";

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
    let authorId = user.id;
    let authorName = getPublicDisplayName(user);
    let postedByUserId: string | undefined;
    let notifyGroupId: string | undefined;

    if (groupId) {
      const group = await assertCanPostGroupCommunityStory(user.id, groupId);
      authorId = groupStoryAuthorId(group.id);
      authorName = group.name;
      postedByUserId = user.id;
      notifyGroupId = group.id;
    }

    if (memberStoryAudioUrl && musicTrackId) {
      return NextResponse.json(
        { error: "Choose either YouTube gospel music or your own recording — not both." },
        { status: 400 },
      );
    }

    if (memberStoryAudioUrl) {
      if (mediaType === "video") {
        return NextResponse.json(
          { error: "Member overlay audio is for photo or text stories. Video keeps its own sound." },
          { status: 400 },
        );
      }
      if (!memberAudioRightsAck) {
        return NextResponse.json(
          { error: "Confirm you have permission to post this audio." },
          { status: 400 },
        );
      }
      if (!isAllowedCommunityMediaUrl(memberStoryAudioUrl)) {
        return NextResponse.json({ error: "Invalid story audio URL." }, { status: 400 });
      }
    }

    let music: CommunityStatusMusic | undefined;
    if (musicTrackId) {
      const attach = await assertTrackAttachable(musicTrackId, undefined, user);
      if (!attach.ok) {
        return NextResponse.json({ error: attach.error }, { status: 400 });
      }
      const track = attach.track;
      music = {
        trackId: track.id,
        title: track.title,
        artist: track.artist,
        youtubeVideoId: track.youtubeVideoId ?? "",
      };
    }

    const status = await addCommunityStatus({
      id: `status-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      authorId,
      authorName,
      mediaUrl,
      mediaType: mediaType ?? "text",
      caption: caption || undefined,
      storyKind,
      groupId: notifyGroupId,
      postedByUserId,
      music,
      memberStoryAudioUrl: memberStoryAudioUrl || null,
    });

    const [withReactions] = await attachReactionsToStatuses([status], user.id);

    void notifyStoryPosted({
      authorId,
      authorName,
      caption: caption || undefined,
      groupId: notifyGroupId,
    });

    if (caption) {
      void notifyMemberMentions({
        authorId: user.id,
        authorName: getPublicDisplayName(user),
        content: caption,
        url: "/community",
        contextLabel: notifyGroupId ? "Group story" : "Story",
        preferenceKey: "announcements",
      });
    }

    return NextResponse.json({ status: withReactions }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not share story.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
