import { parseDirectChatImageUrl } from "@/lib/chat-utils";
import { saveChatAttachmentBytes } from "@/lib/chat-server";
import { chatAttachmentExtension } from "@/lib/chat-attachment-media";

const MAX_IMAGE_BYTES = 15 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

function contentTypeFromUrl(url: string) {
  const path = decodeURIComponent(new URL(url).pathname).toLowerCase();
  if (path.endsWith(".gif")) return "image/gif";
  if (path.endsWith(".png")) return "image/png";
  if (path.endsWith(".webp")) return "image/webp";
  return "image/jpeg";
}

function attachmentNameFromUrl(url: string) {
  try {
    const segment = decodeURIComponent(new URL(url).pathname.split("/").pop() ?? "image");
    return segment || "image.gif";
  } catch {
    return "image.gif";
  }
}

export async function importChatImageFromUrl(input: {
  ownerId: string;
  url: string;
  groupId?: string;
  threadId?: string;
}) {
  const normalized = parseDirectChatImageUrl(input.url);
  if (!normalized) {
    throw new Error("That link is not a direct image or GIF.");
  }

  const response = await fetch(normalized, {
    headers: { Accept: "image/*" },
    redirect: "follow",
    signal: AbortSignal.timeout(20_000),
  });
  if (!response.ok) {
    throw new Error("Could not download that image.");
  }

  const buffer = Buffer.from(await response.arrayBuffer());
  if (buffer.length <= 0 || buffer.length > MAX_IMAGE_BYTES) {
    throw new Error("Image is empty or too large (15 MB max).");
  }

  let contentType =
    response.headers.get("content-type")?.split(";")[0]?.trim().toLowerCase() ?? "";
  if (!ALLOWED_IMAGE_TYPES.has(contentType)) {
    contentType = contentTypeFromUrl(normalized);
  }
  if (!ALLOWED_IMAGE_TYPES.has(contentType)) {
    throw new Error("Use a JPG, PNG, WEBP, or GIF link.");
  }

  const attachmentName = attachmentNameFromUrl(normalized);
  const ext = chatAttachmentExtension({ type: contentType, name: attachmentName });
  const finalName = attachmentName.toLowerCase().endsWith(ext) ? attachmentName : `shared${ext}`;

  return saveChatAttachmentBytes({
    ownerId: input.ownerId,
    buffer,
    contentType,
    attachmentName: finalName,
    groupId: input.groupId,
    threadId: input.threadId,
  });
}

export async function normalizeOutgoingChatMedia(input: {
  ownerId: string;
  content: string;
  attachmentUrl?: string;
  attachmentType?: string;
  attachmentName?: string;
  groupId?: string;
  threadId?: string;
}) {
  if (input.attachmentUrl?.trim()) {
    return {
      content: input.content,
      attachmentUrl: input.attachmentUrl,
      attachmentType: input.attachmentType,
      attachmentName: input.attachmentName,
    };
  }

  const imageUrl = parseDirectChatImageUrl(input.content);
  if (!imageUrl) {
    return {
      content: input.content,
      attachmentUrl: input.attachmentUrl,
      attachmentType: input.attachmentType,
      attachmentName: input.attachmentName,
    };
  }

  const imported = await importChatImageFromUrl({
    ownerId: input.ownerId,
    url: imageUrl,
    groupId: input.groupId,
    threadId: input.threadId,
  });

  return {
    content: "",
    attachmentUrl: imported.attachmentUrl,
    attachmentType: imported.attachmentType,
    attachmentName: imported.attachmentName,
  };
}
