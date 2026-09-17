import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getUserFromSession, recordActivity, SESSION_COOKIE } from "@/lib/auth-server";
import { isUserBlocked } from "@/lib/block-server";
import { getPublicDisplayName } from "@/lib/member-display-name";
import { addStoryReply } from "@/lib/community-status-insights-server";
import { sendDirectMessage } from "@/lib/message-server";
import { notifyNewMessage } from "@/lib/push-server";
import { prisma } from "@/lib/db";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(request: Request, context: RouteContext) {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  const user = await getUserFromSession(token);

  if (!user) {
    return NextResponse.json({ error: "Sign in to reply." }, { status: 401 });
  }

  const { id } = await context.params;
  const statusId = String(id ?? "").trim();
  if (!statusId) {
    return NextResponse.json({ error: "Story not found." }, { status: 404 });
  }

  const body = (await request.json()) as { content?: string };
  const content = String(body.content ?? "").trim();

  try {
    const reply = await addStoryReply({
      statusId,
      authorId: user.id,
      authorName: getPublicDisplayName(user),
      content,
    });

    const status = await prisma.communityStatus.findUnique({
      where: { id: statusId },
      select: { authorId: true, authorName: true },
    });

    if (status && status.authorId !== user.id) {
      const dmContent = `Replied to your story: ${content}`;
      if (!(await isUserBlocked(status.authorId, user.id))) {
        try {
          const result = await sendDirectMessage({
            senderId: user.id,
            senderName: getPublicDisplayName(user),
            recipientId: status.authorId,
            recipientName: status.authorName,
            content: dmContent,
          });
          await recordActivity(user.id, "message_sent", `Messaged ${status.authorName}`);
          await notifyNewMessage({
            recipientId: status.authorId,
            senderName: getPublicDisplayName(user),
            preview: dmContent.slice(0, 120),
            threadId: result.thread.id,
          });
        } catch (notifyError) {
          console.error("[story-reply] DM notify failed:", notifyError);
        }
      }
    }

    return NextResponse.json({ reply }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not reply.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
