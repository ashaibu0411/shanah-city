import { del, list, put } from "@vercel/blob";
import { guessContentType } from "@/lib/gallery-server";
import {
  avatarFileExtension,
  isAllowedAvatarImage,
  normalizeAvatarFile,
} from "@/lib/avatar-image";
import { useBlobStorage } from "@/lib/use-blob";
import * as avatarJson from "@/lib/stores/avatar-json";

function extensionForFile(file: File) {
  return avatarFileExtension(file);
}

function avatarPathnamePattern(userId: string) {
  const escaped = userId.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`^avatars/${escaped}\\.(jpe?g|png|webp|gif)$`, "i");
}

function isAvatarPathnameForUser(userId: string, pathname: string) {
  return avatarPathnamePattern(userId).test(pathname);
}

async function findAvatarBlobs(userId: string) {
  const { blobs } = await list({ prefix: `avatars/${userId}` });
  return blobs
    .filter((blob) => isAvatarPathnameForUser(userId, blob.pathname))
    .sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime());
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function getAvatarFilePath(userId: string) {
  if (useBlobStorage()) {
    const blobs = await findAvatarBlobs(userId);
    return blobs[0]?.pathname ?? null;
  }

  return avatarJson.getAvatarFilePath(userId);
}

export async function saveUserAvatar(userId: string, file: File) {
  const normalized = normalizeAvatarFile(file);
  if (!isAllowedAvatarImage(normalized)) {
    throw new Error("Use JPG, PNG, WEBP, or GIF under 10 MB.");
  }

  if (useBlobStorage()) {
    const bytes = await normalized.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const ext = extensionForFile(normalized);
    const pathname = `avatars/${userId}${ext}`;

    for (const blob of await findAvatarBlobs(userId)) {
      await del(blob.url).catch(() => undefined);
    }

    await put(pathname, buffer, {
      access: "public",
      contentType: normalized.type || undefined,
    });

    return `avatar:${userId}`;
  }

  if (process.env.VERCEL) {
    throw new Error(
      "Profile photos need cloud storage. Add BLOB_READ_WRITE_TOKEN in Vercel (Production), then redeploy.",
    );
  }

  return avatarJson.saveUserAvatar(userId, normalized);
}

export async function registerDirectUploadAvatar(userId: string, blobPathname?: string) {
  if (!useBlobStorage()) {
    throw new Error(
      "Profile photos need cloud storage. Add BLOB_READ_WRITE_TOKEN in Vercel (Production), then redeploy.",
    );
  }

  if (blobPathname) {
    if (!isAvatarPathnameForUser(userId, blobPathname)) {
      throw new Error("Invalid profile photo upload.");
    }

    for (const blob of await findAvatarBlobs(userId)) {
      if (blob.pathname !== blobPathname) {
        await del(blob.url).catch(() => undefined);
      }
    }

    return `avatar:${userId}`;
  }

  let blobs: Awaited<ReturnType<typeof findAvatarBlobs>> = [];
  for (let attempt = 0; attempt < 6; attempt += 1) {
    blobs = await findAvatarBlobs(userId);
    if (blobs.length > 0) break;
    await sleep(250 * (attempt + 1));
  }

  if (blobs.length === 0) {
    throw new Error("Photo upload did not finish. Check your connection and try again.");
  }

  for (const blob of blobs.slice(1)) {
    await del(blob.url).catch(() => undefined);
  }

  return `avatar:${userId}`;
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
