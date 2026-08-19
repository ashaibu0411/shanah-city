import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getUserFromSession, SESSION_COOKIE } from "@/lib/auth-server";
import {
  getChatAttachmentRecord,
  readChatAttachmentFile,
  saveChatAttachment,
} from "@/lib/chat-server";
import { canAccessGroupChat } from "@/lib/group-chat-server";
import { getMessagesForThread } from "@/lib/message-server";
import { isChatAttachmentRef } from "@/lib/chat-utils";

async function canAccessAttachment(
  userId: string,
  record: NonNullable<Awaited<ReturnType<typeof getChatAttachmentRecord>>>,
) {
  if (record.ownerId === userId) return true;
  if (record.groupId) {
    const access = await canAccessGroupChat(record.groupId, userId);
    return access.allowed;
  }
  if (record.threadId) {
    const thread = await getMessagesForThread(record.threadId, userId);
    return Boolean(thread);
  }
  return false;
}

export async function GET(request: Request) {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  const user = await getUserFromSession(token);

  if (!user) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id")?.trim();
  if (!id) {
    return NextResponse.json({ error: "Attachment id is required." }, { status: 400 });
  }

  const record = await getChatAttachmentRecord(id);
  if (!record) {
    return NextResponse.json({ error: "Attachment not found." }, { status: 404 });
  }

  if (!(await canAccessAttachment(user.id, record))) {
    return NextResponse.json({ error: "Not allowed." }, { status: 403 });
  }

  const file = await readChatAttachmentFile(id);
  if (!file) {
    return NextResponse.json({ error: "Attachment not found." }, { status: 404 });
  }

  return new NextResponse(file.buffer, {
    headers: {
      "Content-Type": file.contentType,
      "Cache-Control": "private, max-age=300",
    },
  });
}

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  const user = await getUserFromSession(token);

  if (!user) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file");
    const groupId = String(formData.get("groupId") ?? "").trim() || undefined;
    const threadId = String(formData.get("threadId") ?? "").trim() || undefined;

    if (!(file instanceof File) || file.size === 0) {
      return NextResponse.json({ error: "Choose an image to upload." }, { status: 400 });
    }

    if (groupId) {
      const access = await canAccessGroupChat(groupId, user.id);
      if (!access.allowed) {
        return NextResponse.json({ error: "Join this group to upload images." }, { status: 403 });
      }
    } else if (threadId) {
      const thread = await getMessagesForThread(threadId, user.id);
      if (!thread) {
        return NextResponse.json({ error: "Conversation not found." }, { status: 404 });
      }
    } else {
      return NextResponse.json({ error: "groupId or threadId is required." }, { status: 400 });
    }

    const attachment = await saveChatAttachment({
      ownerId: user.id,
      file,
      groupId,
      threadId,
    });

    if (!isChatAttachmentRef(attachment.attachmentUrl)) {
      return NextResponse.json({ error: "Upload failed." }, { status: 500 });
    }

    return NextResponse.json(attachment, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Upload failed." },
      { status: 400 },
    );
  }
}
