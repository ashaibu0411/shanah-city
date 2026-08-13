import { del, list, put } from "@vercel/blob";
import { guessContentType, isAllowedImage } from "@/lib/gallery-server";
import { useBlobStorage } from "@/lib/use-blob";
import * as avatarJson from "@/lib/stores/avatar-json";

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

async function findAvatarBlobs(userId: string) {
  const { blobs } = await list({ prefix: `avatars/${userId}.` });
  return blobs;
}

export async function getAvatarFilePath(userId: string) {
  if (useBlobStorage()) {
    const blobs = await findAvatarBlobs(userId);
    return blobs[0]?.pathname ?? null;
  }

  return avatarJson.getAvatarFilePath(userId);
}

export async function saveUserAvatar(userId: string, file: File) {
  if (!isAllowedImage(file)) {
    throw new Error("Use JPG, PNG, WEBP, or GIF under 10 MB.");
  }

  if (useBlobStorage()) {
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const ext = extensionForFile(file);
    const pathname = `avatars/${userId}${ext}`;

    for (const blob of await findAvatarBlobs(userId)) {
      await del(blob.url).catch(() => undefined);
    }

    await put(pathname, buffer, {
      access: "public",
      contentType: file.type || undefined,
    });

    return `avatar:${userId}`;
  }

  return avatarJson.saveUserAvatar(userId, file);
}

export async function deleteUserAvatar(userId: string) {
  if (useBlobStorage()) {
    for (const blob of await findAvatarBlobs(userId)) {
      await del(blob.url).catch(() => undefined);
    }
    return;
  }

  await avatarJson.deleteUserAvatar(userId);
}

export async function readAvatarFile(userId: string) {
  if (useBlobStorage()) {
    const blobs = await findAvatarBlobs(userId);
    const blob = blobs[0];
    if (!blob) return null;

    const response = await fetch(blob.url);
    if (!response.ok) return null;

    const buffer = Buffer.from(await response.arrayBuffer());
    const contentType =
      response.headers.get("content-type") ?? guessContentType(blob.pathname);

    return { buffer, contentType };
  }

  return avatarJson.readAvatarFile(userId);
}
