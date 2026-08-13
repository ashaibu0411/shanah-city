import { promises as fs } from "fs";
import path from "path";

function isAllowedImage(file: File) {
  const allowed = ["image/jpeg", "image/png", "image/webp", "image/gif"];
  return allowed.includes(file.type) && file.size <= 10 * 1024 * 1024;
}

function guessContentType(filepath: string) {
  const ext = path.extname(filepath).toLowerCase();
  switch (ext) {
    case ".jpg":
    case ".jpeg":
      return "image/jpeg";
    case ".png":
      return "image/png";
    case ".webp":
      return "image/webp";
    case ".gif":
      return "image/gif";
    default:
      return "application/octet-stream";
  }
}

const AVATAR_DIR = path.join(process.cwd(), "data", "avatars");

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

async function findAvatarFiles(userId: string) {
  try {
    const files = await fs.readdir(AVATAR_DIR);
    return files.filter((file) => file.startsWith(`${userId}.`));
  } catch {
    return [];
  }
}

export async function getAvatarFilePath(userId: string) {
  const matches = await findAvatarFiles(userId);
  if (matches.length === 0) return null;
  return path.join(AVATAR_DIR, matches[0]);
}

export async function saveUserAvatar(userId: string, file: File) {
  if (!isAllowedImage(file)) {
    throw new Error("Use JPG, PNG, WEBP, or GIF under 10 MB.");
  }

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  const ext = extensionForFile(file);
  const filename = `${userId}${ext}`;

  await fs.mkdir(AVATAR_DIR, { recursive: true });

  for (const oldFile of await findAvatarFiles(userId)) {
    await fs.unlink(path.join(AVATAR_DIR, oldFile)).catch(() => undefined);
  }

  await fs.writeFile(path.join(AVATAR_DIR, filename), buffer);
  return `avatar:${userId}`;
}

export async function deleteUserAvatar(userId: string) {
  for (const oldFile of await findAvatarFiles(userId)) {
    await fs.unlink(path.join(AVATAR_DIR, oldFile)).catch(() => undefined);
  }
}

export async function readAvatarFile(userId: string) {
  const filepath = await getAvatarFilePath(userId);
  if (!filepath) return null;

  const buffer = await fs.readFile(filepath);
  return {
    buffer,
    contentType: guessContentType(filepath),
  };
}
