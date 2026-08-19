import { promises as fs } from "fs";
import path from "path";
import { prisma } from "@/lib/db";
import { isAllowedImage } from "@/lib/gallery-server";
import * as chatAttachmentJson from "@/lib/stores/chat-attachment-json";

const ATTACHMENT_DIR = path.join(process.cwd(), "data", "chat-attachments");

function extensionForFile(file: File) {
  switch (file.type) {
    case "image/png":
      return ".png";
    case "image/webp":
      return ".webp";
    case "image/gif":
      return ".gif";
    default:
      return ".jpg";
  }
}

export async function saveChatAttachment(input: {
  ownerId: string;
  file: File;
  groupId?: string;
  threadId?: string;
}) {
  if (!isAllowedImage(input.file)) {
    throw new Error("Use JPG, PNG, WEBP, or GIF under 10 MB.");
  }

  const id = `chat-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const ext = extensionForFile(input.file);
  const filename = `${id}${ext}`;

  await fs.mkdir(ATTACHMENT_DIR, { recursive: true });
  const buffer = Buffer.from(await input.file.arrayBuffer());
  await fs.writeFile(path.join(ATTACHMENT_DIR, filename), buffer);

  await prisma.chatAttachmentMeta.create({
    data: {
      id,
      ownerId: input.ownerId,
      groupId: input.groupId,
      threadId: input.threadId,
      contentType: input.file.type,
      filename,
      createdAt: new Date(),
    },
  });

  return {
    attachmentUrl: `chat:${id}`,
    attachmentType: input.file.type,
    attachmentName: input.file.name,
  };
}

export async function getChatAttachmentRecord(id: string) {
  const record = await prisma.chatAttachmentMeta.findUnique({ where: { id } });
  if (!record) return null;
  return {
    id: record.id,
    ownerId: record.ownerId,
    groupId: record.groupId ?? undefined,
    threadId: record.threadId ?? undefined,
    contentType: record.contentType,
    filename: record.filename,
    createdAt: record.createdAt.toISOString(),
  };
}

export async function readChatAttachmentFile(id: string) {
  return chatAttachmentJson.readChatAttachmentFile(id);
}
