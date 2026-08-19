import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getUserFromSession, recordActivity, SESSION_COOKIE } from "@/lib/auth-server";
import { getChatTypingUsers, setChatTyping } from "@/lib/chat-server";
import { getBlockedUserIds } from "@/lib/block-server";
import {
  canAccessGroupChat,
  deleteGroupChatMessage,
  editGroupChatMessage,
  listGroupChatMessages,
  markGroupChatRead,
  sendGroupChatMessage,
  toggleGroupChatReaction,
} from "@/lib/group-chat-server";
import { isAllowedReactionEmoji } from "@/lib/chat-utils";
import { notifyGroupChatMessage } from "@/lib/push-server";

export async function GET(request: Request) {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  const user = await getUserFromSession(token);

  if (!user) {
    return NextResponse.json({ error: "Sign in to view group chat." }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const groupId = searchParams.get("groupId")?.trim();
  const after = searchParams.get("after")?.trim() || undefined;

  if (!groupId) {
    return NextResponse.json({ error: "groupId is required." }, { status: 400 });
  }

  const access = await canAccessGroupChat(groupId, user.id);
  if (!access.allowed) {
    return NextResponse.json(
      { error: "Join this group to read and send messages." },
      { status: 403 },
    );
  }

  await markGroupChatRead(groupId, user.id);

  const memberIds = access.detail!.memberIds;
  const messages = await listGroupChatMessages(groupId, {
    after,
    viewerId: user.id,
    memberIds,
  });
  const blockedIds = new Set(await getBlockedUserIds(user.id));
  const typingUsers = await getChatTypingUsers({
    channelType: "group",
    channelId: groupId,
    excludeUserId: user.id,
  });

  return NextResponse.json({
    messages: messages.filter((message) => !blockedIds.has(message.senderId)),
    typingUsers,
    group: { id: groupId, name: access.detail!.name },
  });
}

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  const user = await getUserFromSession(token);

  if (!user) {
    return NextResponse.json({ error: "Sign in to send group messages." }, { status: 401 });
  }

  const body = await request.json();
  const action = String(body.action ?? "send");
  const groupId = String(body.groupId ?? "").trim();

  if (!groupId) {
    return NextResponse.json({ error: "groupId is required." }, { status: 400 });
  }

  const access = await canAccessGroupChat(groupId, user.id);
  if (!access.allowed) {
    return NextResponse.json(
      { error: "Join this group to read and send messages." },
      { status: 403 },
    );
  }

  if (action === "typing") {
    await setChatTyping({
      channelType: "group",
      channelId: groupId,
      userId: user.id,
      userName: user.name,
      isTyping: Boolean(body.isTyping),
    });
    return NextResponse.json({ ok: true });
  }

  if (action === "markRead") {
    await markGroupChatRead(groupId, user.id);
    return NextResponse.json({ ok: true });
  }

  if (action === "react") {
    const messageId = String(body.messageId ?? "").trim();
    const emoji = String(body.emoji ?? "").trim();
    if (!messageId || !emoji) {
      return NextResponse.json({ error: "messageId and emoji are required." }, { status: 400 });
    }
    if (!isAllowedReactionEmoji(emoji)) {
      return NextResponse.json({ error: "Choose a supported emoji reaction." }, { status: 400 });
    }

    const message = await toggleGroupChatReaction({
      groupId,
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
    const messageId = String(body.messageId ?? "").trim();
    const content = String(body.content ?? "").trim();
    if (!messageId) {
      return NextResponse.json({ error: "messageId is required." }, { status: 400 });
    }

    try {
      const message = await editGroupChatMessage({
        groupId,
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
    const messageId = String(body.messageId ?? "").trim();
    if (!messageId) {
      return NextResponse.json({ error: "messageId is required." }, { status: 400 });
    }

    try {
      const message = await deleteGroupChatMessage({
        groupId,
        messageId,
        userId: user.id,
        isGroupAdmin: access.detail!.isAdmin,
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
  const attachmentUrl = String(body.attachmentUrl ?? "").trim() || undefined;
  const attachmentType = String(body.attachmentType ?? "").trim() || undefined;
  const attachmentName = String(body.attachmentName ?? "").trim() || undefined;

  if (!content && !attachmentUrl) {
    return NextResponse.json({ error: "Message is required." }, { status: 400 });
  }

  try {
    const message = await sendGroupChatMessage({
      groupId,
      groupName: access.detail!.name,
      senderId: user.id,
      senderName: user.name,
      content,
      attachmentUrl,
      attachmentType,
      attachmentName,
    });

    await recordActivity(user.id, "message_sent", `Group chat in ${access.detail!.name}`);

    const preview = content || attachmentName || "Photo";
    await notifyGroupChatMessage({
      groupId,
      groupName: access.detail!.name,
      senderId: user.id,
      senderName: user.name,
      preview: preview.slice(0, 120),
    });

    return NextResponse.json({ message }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not send message." },
      { status: 400 },
    );
  }
}
