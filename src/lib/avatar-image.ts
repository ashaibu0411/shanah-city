const AVATAR_MAX_BYTES = 10 * 1024 * 1024;

const AVATAR_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

const AVATAR_EXTENSIONS = new Set([".jpg", ".jpeg", ".png", ".webp", ".gif"]);

export function inferAvatarContentType(fileName: string, mimeType?: string) {
  if (mimeType && AVATAR_MIME_TYPES.has(mimeType)) {
    return mimeType;
  }

  const ext = fileName.toLowerCase().match(/\.[a-z0-9]+$/)?.[0] ?? "";
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
      return mimeType || "image/jpeg";
  }
}

export function normalizeAvatarFile(file: File) {
  const contentType = inferAvatarContentType(file.name, file.type);
  if (file.type === contentType) {
    return file;
  }
  return new File([file], file.name || "profile.jpg", { type: contentType });
}

export function isAllowedAvatarImage(file: File) {
  if (file.size <= 0 || file.size > AVATAR_MAX_BYTES) {
    return false;
  }

  const normalized = normalizeAvatarFile(file);
  if (AVATAR_MIME_TYPES.has(normalized.type)) {
    return true;
  }

  const ext = normalized.name.toLowerCase().match(/\.[a-z0-9]+$/)?.[0] ?? "";
  return AVATAR_EXTENSIONS.has(ext);
}

export function avatarFileExtension(file: File) {
  const type = inferAvatarContentType(file.name, file.type);
  switch (type) {
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

export { AVATAR_MAX_BYTES };
