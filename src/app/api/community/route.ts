import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { canManageAsAdmin } from "@/lib/admin-access-server";
import { getUserFromSession, SESSION_COOKIE } from "@/lib/auth-server";
import { getGroups } from "@/lib/group-server";
import {
  addCommentToPost,
  addCommunityPost,
  getCommunityPostsForViewer,
  reactToPost,
} from "@/lib/member-server";
import { notifyCommunityPost } from "@/lib/push-server";

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  const user = await getUserFromSession(token);
  const posts = await getCommunityPostsForViewer(user?.id);
  return NextResponse.json({ posts });
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

  const content = String(body.content ?? "").trim();
  const mediaUrl = body.mediaUrl ? String(body.mediaUrl).trim() : undefined;
  const mediaType = body.mediaType === "video" ? "video" : body.mediaType === "image" ? "image" : undefined;

  if (!content && !mediaUrl) {
    return NextResponse.json({ error: "Add a message, photo, or video." }, { status: 400 });
  }

  if (mediaUrl && !mediaType) {
    return NextResponse.json({ error: "Media type is required." }, { status: 400 });
  }

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
    content: content || (mediaType === "video" ? "Shared a video" : "Shared a photo"),
    type: postType,
    targetGroupId,
    targetGroupName,
  });

  return NextResponse.json({ post }, { status: 201 });
}
