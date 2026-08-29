import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { canManageAsAdmin } from "@/lib/admin-access-server";
import { canManageCommunityPost } from "@/lib/community-access-server";
import { attachCanManageToPosts } from "@/lib/community-post-access";
import {
  COMMUNITY_POST_MAX_MEDIA,
  communityPostHasMedia,
  communityPostMediaSummary,
  parseCommunityPostMediaInput,
} from "@/lib/community-post-media";
import { getUserFromSession, SESSION_COOKIE } from "@/lib/auth-server";
import { getGroups } from "@/lib/group-server";
import type { CommunityPost } from "@/lib/member-types";
import {
  addCommentToPost,
  addCommunityPost,
  deleteCommunityPost,
  getCommunityPostById,
  getCommunityPostsForViewer,
  reactToPost,
  updateCommunityPost,
} from "@/lib/member-server";
import { notifyCommunityPost } from "@/lib/push-server";

function parseMemberPostType(value: unknown): CommunityPost["type"] | null {
  if (value === "prayer" || value === "praise") return value;
  return null;
}

async function resolveEditedPostFields(
  user: NonNullable<Awaited<ReturnType<typeof getUserFromSession>>>,
  post: CommunityPost,
  body: Record<string, unknown>,
) {
  const content = String(body.content ?? "").trim();
  if (!content && !communityPostHasMedia(post)) {
    return { error: "Add a message or keep the attached photo/video." as const };
  }

  const isAdmin = await canManageAsAdmin(user);
  let type = post.type;
  let targetGroupId = post.targetGroupId;
  let targetGroupName = post.targetGroupName;

  if (post.type === "announcement") {
    if (!isAdmin) {
      return { error: "Only Admin Group members can edit church news posts." as const };
    }
    type = "announcement";
    const nextTargetGroupId = body.targetGroupId ? String(body.targetGroupId).trim() : "";
    if (nextTargetGroupId) {
      const groups = await getGroups();
      const group = groups.find((entry) => entry.id === nextTargetGroupId);
      if (!group) {
        return { error: "Target group not found." as const };
      }
      targetGroupId = group.id;
      targetGroupName = group.name;
    } else {
      targetGroupId = undefined;
      targetGroupName = undefined;
    }
  } else {
    const requestedType = parseMemberPostType(body.type);
    if (requestedType) {
      type = requestedType;
    } else if (body.type === "announcement") {
      return { error: "Only Admin Group members can post church news." as const };
    }
    targetGroupId = undefined;
    targetGroupName = undefined;
  }

  return {
    update: { content, type, targetGroupId, targetGroupName },
  };
}

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  const user = await getUserFromSession(token);
  const posts = await getCommunityPostsForViewer(user?.id);
  const isAdmin = user ? await canManageAsAdmin(user) : false;
  return NextResponse.json({ posts: attachCanManageToPosts(posts, user, isAdmin) });
}

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  const user = await getUserFromSession(token);
  const body = await request.json();
  const authorName = user?.name ?? body.author ?? "Member";

  if (body.action === "comment") {
    const comment = await addCommentToPost(body.postId, {
      id: `c-${Date.now()}`,
      author: authorName,
      content: String(body.content ?? "").trim(),
      createdAt: new Date().toISOString(),
    });
    if (!comment) {
      return NextResponse.json({ error: "Post not found." }, { status: 404 });
    }
    return NextResponse.json({ post: comment });
  }

  if (body.action === "react") {
    const post = await reactToPost(body.postId);
    if (!post) {
      return NextResponse.json({ error: "Post not found." }, { status: 404 });
    }
    return NextResponse.json({ post });
  }

  if (body.action === "edit" || body.action === "delete") {
    if (!user) {
      return NextResponse.json({ error: "Sign in to manage your post." }, { status: 401 });
    }

    const postId = String(body.postId ?? "").trim();
    if (!postId) {
      return NextResponse.json({ error: "Post not found." }, { status: 404 });
    }

    const post = await getCommunityPostById(postId);
    if (!post) {
      return NextResponse.json({ error: "Post not found." }, { status: 404 });
    }

    if (!(await canManageCommunityPost(user, post))) {
      return NextResponse.json(
        { error: "You can only edit or delete your own posts." },
        { status: 403 },
      );
    }

    if (body.action === "delete") {
      const deleted = await deleteCommunityPost(postId);
      if (!deleted) {
        return NextResponse.json({ error: "Post not found." }, { status: 404 });
      }
      return NextResponse.json({ ok: true, postId });
    }

    const resolved = await resolveEditedPostFields(user, post, body);
    if ("error" in resolved) {
      return NextResponse.json({ error: resolved.error }, { status: 400 });
    }

    const updated = await updateCommunityPost(postId, {
      ...resolved.update,
      authorId: post.authorId ?? user.id,
      author: post.author || user.name,
    });
    if (!updated) {
      return NextResponse.json({ error: "Post not found." }, { status: 404 });
    }

    return NextResponse.json({ post: { ...updated, canManage: true } });
  }

  const content = String(body.content ?? "").trim();
  const mediaItems = parseCommunityPostMediaInput(body);

  if (!content && mediaItems.length === 0) {
    return NextResponse.json({ error: "Add a message, photo, or video." }, { status: 400 });
  }

  if (mediaItems.length > COMMUNITY_POST_MAX_MEDIA) {
    return NextResponse.json(
      { error: `You can attach up to ${COMMUNITY_POST_MAX_MEDIA} photos or videos.` },
      { status: 400 },
    );
  }

  const mediaUrl = mediaItems[0]?.url;
  const mediaType = mediaItems[0]?.type as CommunityPost["mediaType"] | undefined;

  if (!user) {
    return NextResponse.json({ error: "Sign in to post." }, { status: 401 });
  }

  const postType = body.type ?? "prayer";

  if (postType === "announcement") {
    if (!(await canManageAsAdmin(user))) {
      return NextResponse.json(
        { error: "Only Admin Group members can post church announcements." },
        { status: 403 },
      );
    }
  }

  let targetGroupId = body.targetGroupId ? String(body.targetGroupId).trim() : undefined;
  let targetGroupName = body.targetGroupName ? String(body.targetGroupName).trim() : undefined;

  if (postType === "announcement" && targetGroupId) {
    const groups = await getGroups();
    const group = groups.find((entry) => entry.id === targetGroupId);
    if (!group) {
      return NextResponse.json({ error: "Target group not found." }, { status: 404 });
    }
    targetGroupName = group.name;
  } else if (postType !== "announcement") {
    targetGroupId = undefined;
    targetGroupName = undefined;
  }

  const post = await addCommunityPost({
    id: String(Date.now()),
    author: authorName,
    authorId: user.id,
    campusId: body.campusId ?? user.campusId ?? "colorado",
    content: content || "",
    mediaUrl,
    mediaType,
    mediaItems: mediaItems.length ? mediaItems : undefined,
    timeAgo: "Just now",
    type: postType,
    reactions: 0,
    targetGroupId,
    targetGroupName,
    comments: [],
    createdAt: new Date().toISOString(),
  });

  await notifyCommunityPost({
    authorId: user.id,
    authorName,
    content: content || communityPostMediaSummary(mediaItems),
    type: postType,
    targetGroupId,
    targetGroupName,
  });

  return NextResponse.json({ post }, { status: 201 });
}
