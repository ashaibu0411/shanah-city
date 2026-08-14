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
  if (!content) {
    return NextResponse.json({ error: "Content is required." }, { status: 400 });
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
    campusId: body.campusId ?? user?.campusId ?? "colorado",
    content,
    timeAgo: "Just now",
    type: postType,
    reactions: 0,
    targetGroupId,
    targetGroupName,
    comments: [],
  });

  await notifyCommunityPost({
    authorId: user?.id,
    authorName,
    content,
    type: postType,
    targetGroupId,
    targetGroupName,
  });

  return NextResponse.json({ post }, { status: 201 });
}
