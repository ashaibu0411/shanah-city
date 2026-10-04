import { isAllowedImage } from "@/lib/gallery-server";

const MAX_AUDIO_BYTES = 15 * 1024 * 1024;

export function isAllowedChatAudio(file: Pick<File, "type" | "size" | "name">) {
  if (file.size <= 0 || file.size > MAX_AUDIO_BYTES) return false;
  const baseType = file.type.split(";")[0]?.trim().toLowerCase() ?? "";
  if (baseType.startsWith("audio/")) return true;
  if (baseType === "video/webm") return true;
  const name = file.name.toLowerCase();
  return /\.(webm|m4a|mp4|mp3|ogg|aac|wav)$/.test(name);
}

export function isAllowedChatAttachment(file: File) {
  return isAllowedImage(file) || isAllowedChatAudio(file);
}

export function chatAttachmentExtension(file: Pick<File, "type" | "name">) {
  switch (file.type.split(";")[0]?.trim().toLowerCase()) {
    case "image/png":
      return ".png";
    case "image/webp":
      return ".webp";
    case "image/gif":
      return ".gif";
    case "image/jpeg":
      return ".jpg";
    case "audio/webm":
    case "video/webm":
      return ".webm";
    case "audio/mp4":
    case "audio/aac":
      return ".m4a";
    case "audio/mpeg":
      return ".mp3";
    case "audio/ogg":
      return ".ogg";
    case "audio/wav":
    case "audio/x-wav":
      return ".wav";
    default:
      break;
  }
  const lower = file.name.toLowerCase();
  if (lower.endsWith(".png")) return ".png";
  if (lower.endsWith(".webp")) return ".webp";
  if (lower.endsWith(".gif")) return ".gif";
  if (lower.endsWith(".webm")) return ".webm";
  if (lower.endsWith(".m4a") || lower.endsWith(".mp4")) return ".m4a";
  if (lower.endsWith(".mp3")) return ".mp3";
  if (lower.endsWith(".ogg")) return ".ogg";
  if (lower.endsWith(".wav")) return ".wav";
  return ".jpg";
}

export function guessChatAttachmentContentType(filepath: string) {
  const ext = filepath.slice(filepath.lastIndexOf(".")).toLowerCase();
  switch (ext) {
    case ".png":
      return "image/png";
    case ".webp":
      return "image/webp";
    case ".gif":
      return "image/gif";
    case ".webm":
      return "audio/webm";
    case ".m4a":
      return "audio/mp4";
    case ".mp3":
      return "audio/mpeg";
    case ".ogg":
      return "audio/ogg";
    case ".wav":
      return "audio/wav";
    default:
      return "image/jpeg";
  }
}
