import { promises as fs } from "fs";
import path from "path";
import { isAllowedImage } from "@/lib/gallery-server";

const ATTACHMENT_DIR = path.join(process.cwd(), "data", "chat-attachments");
const INDEX_FILE = path.join(process.cwd(), "data", "chat-attachments-index.json");

type ChatAttachmentRecord = {
  id: string;
  ownerId: string;
  groupId?: string;
  threadId?: string;
  contentType: string;
  filename: string;
  createdAt: string;
};

async function readIndex() {
  try {
    const raw = await fs.readFile(INDEX_FILE, "utf-8");
    return JSON.parse(raw) as ChatAttachmentRecord[];
  } catch {
    return [];
  }
}

async function writeIndex(records: ChatAttachmentRecord[]) {
  await fs.mkdir(path.dirname(INDEX_FILE), { recursive: true });
  await fs.writeFile(INDEX_FILE, JSON.stringify(records, null, 2));
}

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

function guessContentType(filepath: string) {
  const ext = path.extname(filepath).toLowerCase();
  switch (ext) {
    case ".png":
      return "image/png";
    case ".webp":
      return "image/webp";
    case ".gif":
      return "image/gif";
    default:
      return "image/jpeg";
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

  const record: ChatAttachmentRecord = {
    id,
    ownerId: input.ownerId,
    groupId: input.groupId,
    threadId: input.threadId,
    contentType: input.file.type,
    filename,
    createdAt: new Date().toISOString(),
  };

  const index = await readIndex();
  index.unshift(record);
  await writeIndex(index.slice(0, 2000));

  return {
    attachmentUrl: `chat:${id}`,
    attachmentType: input.file.type,
    attachmentName: input.file.name,
  };
}

export async function getChatAttachmentRecord(id: string) {
  const index = await readIndex();
  return index.find((record) => record.id === id) ?? null;
}

export async function readChatAttachmentFile(id: string) {
  const record = await getChatAttachmentRecord(id);
  if (!record) return null;

  const filepath = path.join(ATTACHMENT_DIR, record.filename);
  try {
    const buffer = await fs.readFile(filepath);
    return {
      buffer,
      contentType: record.contentType || guessContentType(filepath),
      record,
    };
  } catch {
    return null;
  }
}
