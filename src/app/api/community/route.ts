import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { canManageDevotions, getUserFromSession, SESSION_COOKIE } from "@/lib/auth-server";
import {
  addCommentToPost,
  addCommunityPost,
  getCommunityPosts,
  reactToPost,
} from "@/lib/member-server";
import { notifyCommunityPost } from "@/lib/push-server";

export async function GET() {
  const posts = await getCommunityPosts();
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
    if (!canManageDevotions(user, body.pin)) {
      return NextResponse.json(
        { error: "Only leaders can post church announcements." },
        { status: 403 },
      );
    }
  }

  const post = await addCommunityPost({
    id: String(Date.now()),
    author: postType === "announcement" ? authorName : authorName,
    campusId: body.campusId ?? user?.campusId ?? "colorado",
    content,
    timeAgo: "Just now",
    type: postType,
    reactions: 0,
    comments: [],
  });

  await notifyCommunityPost({
    authorId: user?.id,
    authorName,
    content,
    type: postType,
  });

  return NextResponse.json({ post }, { status: 201 });
}
