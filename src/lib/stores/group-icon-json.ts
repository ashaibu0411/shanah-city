import { promises as fs } from "fs";
import path from "path";
import { guessContentType, isAllowedImage } from "@/lib/gallery-server";

const ICON_DIR = path.join(process.cwd(), "data", "group-icons");

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

async function findIconFiles(groupId: string) {
  try {
    const files = await fs.readdir(ICON_DIR);
    return files.filter((file) => file.startsWith(`${groupId}.`));
  } catch {
    return [];
  }
}

export async function saveGroupIconFile(groupId: string, file: File) {
  if (!isAllowedImage(file)) {
    throw new Error("Use JPG, PNG, WEBP, or GIF under 10 MB.");
  }

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  const ext = extensionForFile(file);
  const filename = `${groupId}${ext}`;

  await fs.mkdir(ICON_DIR, { recursive: true });

  for (const oldFile of await findIconFiles(groupId)) {
    await fs.unlink(path.join(ICON_DIR, oldFile)).catch(() => undefined);
  }

  await fs.writeFile(path.join(ICON_DIR, filename), buffer);
  return `group-icon:${groupId}`;
}

export async function deleteGroupIconFile(groupId: string) {
  for (const oldFile of await findIconFiles(groupId)) {
    await fs.unlink(path.join(ICON_DIR, oldFile)).catch(() => undefined);
  }
}

export async function readGroupIconFile(groupId: string) {
  const matches = await findIconFiles(groupId);
  if (matches.length === 0) return null;
  const filepath = path.join(ICON_DIR, matches[0]);
  const buffer = await fs.readFile(filepath);
  return {
    buffer,
    contentType: guessContentType(filepath),
  };
}
