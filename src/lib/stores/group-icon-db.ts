import { del, list, put } from "@vercel/blob";
import { isAllowedImage } from "@/lib/gallery-server";
import { useBlobStorage } from "@/lib/use-blob";
import * as groupIconJson from "@/lib/stores/group-icon-json";

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

async function findIconBlobs(groupId: string) {
  const { blobs } = await list({ prefix: `group-icons/${groupId}.` });
  return blobs;
}

export async function saveGroupIconFile(groupId: string, file: File) {
  if (!isAllowedImage(file)) {
    throw new Error("Use JPG, PNG, WEBP, or GIF under 10 MB.");
  }

  if (useBlobStorage()) {
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const ext = extensionForFile(file);
    const pathname = `group-icons/${groupId}${ext}`;

    for (const blob of await findIconBlobs(groupId)) {
      await del(blob.url).catch(() => undefined);
    }

    await put(pathname, buffer, {
      access: "public",
      contentType: file.type || undefined,
    });

    return `group-icon:${groupId}`;
  }

  return groupIconJson.saveGroupIconFile(groupId, file);
}

export async function deleteGroupIconFile(groupId: string) {
  if (useBlobStorage()) {
    for (const blob of await findIconBlobs(groupId)) {
      await del(blob.url).catch(() => undefined);
    }
    return;
  }

  await groupIconJson.deleteGroupIconFile(groupId);
}

export async function readGroupIconFile(groupId: string) {
  if (useBlobStorage()) {
    const blobs = await findIconBlobs(groupId);
    const blob = blobs[0];
    if (!blob) return null;

    const response = await fetch(blob.url);
    if (!response.ok) return null;

    const buffer = Buffer.from(await response.arrayBuffer());
    const contentType =
      response.headers.get("content-type") ?? "application/octet-stream";

    return { buffer, contentType };
  }

  return groupIconJson.readGroupIconFile(groupId);
}
