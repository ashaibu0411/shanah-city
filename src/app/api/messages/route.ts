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
import { getPublicDisplayName } from "@/lib/member-display-name";
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
      userName: getPublicDisplayName(user),
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
      userName: getPublicDisplayName(user),
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
  const recipientIds = Array.isArray(body.recipientIds)
    ? body.recipientIds.map((id: unknown) => String(id).trim()).filter(Boolean)
    : [];
  const recipientNames =
    body.recipientNames && typeof body.recipientNames === "object"
      ? (body.recipientNames as Record<string, string>)
      : undefined;
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

  if (!threadId && recipientIds.length === 0 && !recipientId) {
    return NextResponse.json(
      { error: "Choose at least one member to message." },
      { status: 400 },
    );
  }

  if (!threadId && recipientIds.length === 0 && recipientId === user.id) {
    return NextResponse.json(
      { error: "You cannot message yourself." },
      { status: 400 },
    );
  }

  try {
    const result = await sendDirectMessage({
      senderId: user.id,
      senderName: getPublicDisplayName(user),
      recipientId: recipientIds.length === 0 ? recipientId : undefined,
      recipientName,
      recipientIds: recipientIds.length > 0 ? recipientIds : undefined,
      recipientNames,
      content,
      threadId,
      attachmentUrl,
      attachmentType,
      attachmentName,
      replyToMessageId: String(body.replyToMessageId ?? "").trim() || undefined,
      replyExcerpt: String(body.replyExcerpt ?? "").trim() || undefined,
    });

    const label =
      recipientIds.length > 1
        ? `${recipientIds.length} members`
        : recipientName || "a member";
    await recordActivity(user.id, "message_sent", `Messaged ${label}`);

    const notifyTargets = result.thread.participantIds.filter((id) => id !== user.id);
    let lastNotify;
    for (const targetId of notifyTargets) {
      if (await isUserBlocked(targetId, user.id)) continue;
      const preview = content || attachmentName || "Photo";
      lastNotify = await notifyNewMessage({
        recipientId: targetId,
        senderName: getPublicDisplayName(user),
        preview: preview.slice(0, 120),
        threadId: result.thread.id,
      });
    }
    if (lastNotify) {
      return NextResponse.json({ ...result, notify: lastNotify }, { status: 201 });
    }

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not send message." },
      { status: 400 },
    );
  }
}
