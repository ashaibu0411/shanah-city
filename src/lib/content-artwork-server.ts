import { put } from "@vercel/blob";
import { promises as fs } from "fs";
import path from "path";
import type { ArtworkVariant } from "@/lib/devotion-artwork";
import { useBlobStorage } from "@/lib/use-blob";

export const CONTENT_ARTWORK_MAX_BYTES = 8 * 1024 * 1024;

const IMAGE_TYPES = new Set(["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"]);

function safeFileName(name: string) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9.-]/g, "-")
    .replace(/-+/g, "-");
}

function isImageFile(file: File) {
  const lower = file.name.toLowerCase();
  return (
    IMAGE_TYPES.has(file.type) ||
    lower.endsWith(".jpg") ||
    lower.endsWith(".jpeg") ||
    lower.endsWith(".png") ||
    lower.endsWith(".webp") ||
    lower.endsWith(".gif")
  );
}

export async function saveContentArtwork(
  file: File,
  contentType: string,
  contentId: string,
  variant: ArtworkVariant,
) {
  if (!isImageFile(file)) {
    throw new Error("Upload a JPG, PNG, WEBP, or GIF image.");
  }
  if (file.size > CONTENT_ARTWORK_MAX_BYTES) {
    throw new Error("Image must be under 8 MB.");
  }

  if (useBlobStorage()) {
    const bytes = await file.arrayBuffer();
    const blob = await put(
      `artwork/${contentType}/${contentId}/${variant}-${Date.now()}-${safeFileName(file.name)}`,
      Buffer.from(bytes),
      {
        access: "public",
        contentType: file.type || "image/jpeg",
      },
    );
    return blob.url;
  }

  const uploadsDir = path.join(
    process.cwd(),
    "public",
    "uploads",
    "artwork",
    contentType,
    contentId,
  );
  await fs.mkdir(uploadsDir, { recursive: true });
  const fileName = `${variant}-${Date.now()}-${safeFileName(file.name)}`;
  await fs.writeFile(path.join(uploadsDir, fileName), Buffer.from(await file.arrayBuffer()));
  return `/uploads/artwork/${contentType}/${contentId}/${fileName}`;
}
