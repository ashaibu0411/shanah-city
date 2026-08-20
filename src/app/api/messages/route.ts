import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  getUserFromSession,
  recordActivity,
  SESSION_COOKIE,
} from "@/lib/auth-server";
import { getChatTypingUsers, setChatTyping } from "@/lib/chat-server";
import {
  deleteDirectMessage,
  editDirectMessage,
  getMemberDirectory,
  getMessagesForThread,
  getOtherParticipant,
  getOtherParticipantId,
  getThreadsForUser,
  markThreadRead,
  sendDirectMessage,
  toggleDirectMessageReaction,
} from "@/lib/message-server";
import { isUserBlocked } from "@/lib/block-server";
import { isAllowedReactionEmoji } from "@/lib/chat-utils";
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
    const typingUsers = await getChatTypingUsers({
      channelType: "thread",
      channelId: threadId,
      excludeUserId: user.id,
    });
    return NextResponse.json({ ...result, typingUsers });
  }

  const threads = await getThreadsForUser(user.id);
  const members = await getMemberDirectory(user.id);

  return NextResponse.json({
    threads: threads.map((thread) => ({
      ...thread,
      otherName: getOtherParticipant(thread, user.id),
      otherUserId: getOtherParticipantId(thread, user.id),
    })),
    members,
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
  const action = String(body.action ?? "send");

  if (action === "typing") {
    const threadId = String(body.threadId ?? "").trim();
    if (!threadId) {
      return NextResponse.json({ error: "threadId is required." }, { status: 400 });
    }
    const existing = await getMessagesForThread(threadId, user.id);
    if (!existing) {
      return NextResponse.json({ error: "Conversation not found." }, { status: 404 });
    }
    await setChatTyping({
      channelType: "thread",
      channelId: threadId,
      userId: user.id,
      userName: user.name,
      isTyping: Boolean(body.isTyping),
    });
    return NextResponse.json({ ok: true });
  }

  if (action === "markRead") {
    const threadId = String(body.threadId ?? "").trim();
    if (!threadId) {
      return NextResponse.json({ error: "threadId is required." }, { status: 400 });
    }
    await markThreadRead(threadId, user.id);
    return NextResponse.json({ ok: true });
  }

  if (action === "react") {
    const threadId = String(body.threadId ?? "").trim();
    const messageId = String(body.messageId ?? "").trim();
    const emoji = String(body.emoji ?? "").trim();

    if (!threadId || !messageId || !emoji) {
      return NextResponse.json({ error: "threadId, messageId, and emoji are required." }, { status: 400 });
    }
    if (!isAllowedReactionEmoji(emoji)) {
      return NextResponse.json({ error: "Choose a supported emoji reaction." }, { status: 400 });
    }

    const message = await toggleDirectMessageReaction({
      threadId,
      messageId,
      emoji,
      userId: user.id,
      userName: user.name,
    });

    if (!message) {
      return NextResponse.json({ error: "Message not found." }, { status: 404 });
    }

    return NextResponse.json({ message });
  }

  if (action === "edit") {
    const threadId = String(body.threadId ?? "").trim();
    const messageId = String(body.messageId ?? "").trim();
    const content = String(body.content ?? "").trim();
    if (!threadId || !messageId) {
      return NextResponse.json({ error: "threadId and messageId are required." }, { status: 400 });
    }

    try {
      const message = await editDirectMessage({
        threadId,
        messageId,
        userId: user.id,
        content,
      });
      if (!message) {
        return NextResponse.json({ error: "Message not found." }, { status: 404 });
      }
      return NextResponse.json({ message });
    } catch (error) {
      return NextResponse.json(
        { error: error instanceof Error ? error.message : "Could not edit message." },
        { status: 400 },
      );
    }
  }

  if (action === "delete") {
    const threadId = String(body.threadId ?? "").trim();
    const messageId = String(body.messageId ?? "").trim();
    if (!threadId || !messageId) {
      return NextResponse.json({ error: "threadId and messageId are required." }, { status: 400 });
    }

    try {
      const message = await deleteDirectMessage({
        threadId,
        messageId,
        userId: user.id,
      });
      if (!message) {
        return NextResponse.json({ error: "Message not found." }, { status: 404 });
      }
      return NextResponse.json({ message });
    } catch (error) {
      return NextResponse.json(
        { error: error instanceof Error ? error.message : "Could not delete message." },
        { status: 400 },
      );
    }
  }

  const content = String(body.content ?? "").trim();
  let recipientId = String(body.recipientId ?? "");
  let recipientName = String(body.recipientName ?? "Member").trim();
  const threadId = body.threadId ? String(body.threadId) : undefined;
  const attachmentUrl = String(body.attachmentUrl ?? "").trim() || undefined;
  const attachmentType = String(body.attachmentType ?? "").trim() || undefined;
  const attachmentName = String(body.attachmentName ?? "").trim() || undefined;

  if (!content && !attachmentUrl) {
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
      attachmentUrl,
      attachmentType,
      attachmentName,
    });

    await recordActivity(user.id, "message_sent", `Messaged ${recipientName || "a member"}`);

    if (recipientId && recipientId !== user.id) {
      const blocked = await isUserBlocked(recipientId, user.id);
      if (!blocked) {
        const preview = content || attachmentName || "Photo";
        const notify = await notifyNewMessage({
          recipientId,
          senderName: user.name,
          preview: preview.slice(0, 120),
          threadId: result.thread.id,
        });
        return NextResponse.json({ ...result, notify }, { status: 201 });
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
