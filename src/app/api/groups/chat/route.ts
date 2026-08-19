import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getUserFromSession, recordActivity, SESSION_COOKIE } from "@/lib/auth-server";
import {
  canAccessGroupChat,
  listGroupChatMessages,
  sendGroupChatMessage,
} from "@/lib/group-chat-server";
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

  const messages = await listGroupChatMessages(groupId, { after });
  return NextResponse.json({ messages, group: { id: groupId, name: access.detail!.name } });
}

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  const user = await getUserFromSession(token);

  if (!user) {
    return NextResponse.json({ error: "Sign in to send group messages." }, { status: 401 });
  }

  const body = await request.json();
  const groupId = String(body.groupId ?? "").trim();
  const content = String(body.content ?? "").trim();

  if (!groupId) {
    return NextResponse.json({ error: "groupId is required." }, { status: 400 });
  }

  if (!content) {
    return NextResponse.json({ error: "Message is required." }, { status: 400 });
  }

  const access = await canAccessGroupChat(groupId, user.id);
  if (!access.allowed) {
    return NextResponse.json(
      { error: "Join this group to read and send messages." },
      { status: 403 },
    );
  }

  try {
    const message = await sendGroupChatMessage({
      groupId,
      groupName: access.detail!.name,
      senderId: user.id,
      senderName: user.name,
      content,
    });

    await recordActivity(user.id, "message_sent", `Group chat in ${access.detail!.name}`);

    await notifyGroupChatMessage({
      groupId,
      groupName: access.detail!.name,
      senderId: user.id,
      senderName: user.name,
      preview: content.slice(0, 120),
    });

    return NextResponse.json({ message }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not send message." },
      { status: 400 },
    );
  }
}
