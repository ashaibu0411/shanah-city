import { MEDIA_CLIP_MAX_BYTES, MEDIA_CLIP_MAX_SECONDS } from "@/lib/media-clip-limits";

export function isAllowedMediaClipFileClient(file: File) {
  if (file.size > MEDIA_CLIP_MAX_BYTES) return false;
  const type = file.type.toLowerCase();
  const name = file.name.toLowerCase();
  return (
    type.startsWith("video/") ||
    name.endsWith(".mp4") ||
    name.endsWith(".mov") ||
    name.endsWith(".webm") ||
    name.endsWith(".m4v")
  );
}

export async function inspectMediaClipFile(file: File) {
  const objectUrl = URL.createObjectURL(file);

  try {
    const video = document.createElement("video");
    video.muted = true;
    video.playsInline = true;
    video.preload = "metadata";

    const loaded = new Promise<void>((resolve, reject) => {
      video.onloadedmetadata = () => resolve();
      video.onerror = () => reject(new Error("Could not read this video."));
    });
    video.src = objectUrl;
    await loaded;

    const duration = Number.isFinite(video.duration) ? video.duration : 0;
    if (duration > MEDIA_CLIP_MAX_SECONDS) {
      throw new Error("Keep shorts under 3 minutes.");
    }

    await new Promise<void>((resolve) => {
      const finish = () => resolve();
      video.onseeked = finish;
      window.setTimeout(finish, 800);
      video.currentTime = Math.min(0.4, Math.max(0, duration / 8 || 0));
    });

    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth || 720;
    canvas.height = video.videoHeight || 1280;
    canvas.getContext("2d")?.drawImage(video, 0, 0, canvas.width, canvas.height);

    const poster = await new Promise<File | null>((resolve) => {
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            resolve(null);
            return;
          }
          resolve(new File([blob], `${file.name.replace(/\.[^.]+$/, "")}-poster.jpg`, { type: "image/jpeg" }));
        },
        "image/jpeg",
        0.82,
      );
    });

    return { duration, poster };
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}
