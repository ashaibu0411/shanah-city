import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { canManageAsAdmin } from "@/lib/admin-access-server";
import {
  getUserFromSession,
  recordActivity,
  SESSION_COOKIE,
} from "@/lib/auth-server";
import {
  getMemberDirectory,
  getMessagesForThread,
  getOtherParticipant,
  getOtherParticipantId,
  getThreadsForUser,
  sendDirectMessage,
} from "@/lib/message-server";
import { isUserBlocked } from "@/lib/block-server";
import { notifyNewMessage } from "@/lib/push-server";

export async function GET(request: Request) {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  const user = await getUserFromSession(token);

  if (!user) {
    return NextResponse.json({ error: "Sign in to view messages." }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const threadId = searchParams.get("threadId");

  if (threadId) {
    const result = await getMessagesForThread(threadId, user.id);
    if (!result) {
      return NextResponse.json({ error: "Conversation not found." }, { status: 404 });
    }
    return NextResponse.json(result);
  }

  const threads = await getThreadsForUser(user.id);
  const isAdmin = await canManageAsAdmin(user);
  const members = isAdmin ? await getMemberDirectory(user.id) : [];

  return NextResponse.json({
    threads: threads.map((thread) => ({
      ...thread,
      otherName: getOtherParticipant(thread, user.id),
      otherUserId: getOtherParticipantId(thread, user.id),
    })),
    members,
    canStartMessages: isAdmin,
    user,
  });
}

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  const user = await getUserFromSession(token);

  if (!user) {
    return NextResponse.json({ error: "Sign in to send messages." }, { status: 401 });
  }

  const body = await request.json();
  const content = String(body.content ?? "").trim();
  let recipientId = String(body.recipientId ?? "");
  let recipientName = String(body.recipientName ?? "Member").trim();
  const threadId = body.threadId ? String(body.threadId) : undefined;

  if (!content) {
    return NextResponse.json({ error: "Message is required." }, { status: 400 });
  }

  if (threadId) {
    const existing = await getMessagesForThread(threadId, user.id);
    if (!existing) {
      return NextResponse.json({ error: "Conversation not found." }, { status: 404 });
    }
    const otherId = existing.thread.participantIds.find((id) => id !== user.id);
    if (otherId) {
      recipientId = otherId;
      recipientName = getOtherParticipant(existing.thread, user.id);
    }
  }

  if (!threadId && !recipientId) {
    return NextResponse.json(
      { error: "Choose a member to message." },
      { status: 400 },
    );
  }

  if (!threadId && !(await canManageAsAdmin(user))) {
    return NextResponse.json(
      { error: "Only Admin Group members can start new conversations." },
      { status: 403 },
    );
  }

  if (recipientId === user.id) {
    return NextResponse.json(
      { error: "You cannot message yourself." },
      { status: 400 },
    );
  }

  try {
    const result = await sendDirectMessage({
      senderId: user.id,
      senderName: user.name,
      recipientId,
      recipientName,
      content,
      threadId,
    });

    await recordActivity(user.id, "message_sent", `Messaged ${recipientName || "a member"}`);

    if (recipientId && recipientId !== user.id) {
      const blocked = await isUserBlocked(recipientId, user.id);
      if (!blocked) {
        await notifyNewMessage({
          recipientId,
          senderName: user.name,
          preview: content.slice(0, 120),
          threadId: result.thread.id,
        });
      }
    }

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not send message." },
      { status: 400 },
    );
  }
}
