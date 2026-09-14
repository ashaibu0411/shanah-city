/** Client-side checks before uploading story video (duration + size). */
export async function validateCommunityStoryVideoFile(file: File): Promise<string | null> {
  const { validateCommunityStoryFile } = await import("@/lib/community-media-client");
  const { COMMUNITY_VIDEO_MAX_DURATION_SEC, isCommunityVideoFile } = await import(
    "@/lib/community-media-shared"
  );

  const sizeError = validateCommunityStoryFile(file);
  if (sizeError) return sizeError;

  if (!isCommunityVideoFile(file)) {
    return null;
  }

  const duration = await readVideoDurationSeconds(file);
  if (duration == null) {
    return null;
  }
  if (duration > COMMUNITY_VIDEO_MAX_DURATION_SEC) {
    return `Video is ${Math.round(duration)}s — moments support up to ${COMMUNITY_VIDEO_MAX_DURATION_SEC} seconds. Trim and try again.`;
  }
  return null;
}

function readVideoDurationSeconds(file: File): Promise<number | null> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const video = document.createElement("video");
    video.preload = "metadata";
    video.muted = true;
    video.playsInline = true;

    const cleanup = () => {
      video.removeAttribute("src");
      video.load();
      URL.revokeObjectURL(url);
    };

    const timeout = window.setTimeout(() => {
      cleanup();
      resolve(null);
    }, 12000);

    video.onloadedmetadata = () => {
      window.clearTimeout(timeout);
      const duration = video.duration;
      cleanup();
      if (!Number.isFinite(duration) || duration <= 0) {
        resolve(null);
        return;
      }
      resolve(duration);
    };

    video.onerror = () => {
      window.clearTimeout(timeout);
      cleanup();
      resolve(null);
    };

    video.src = url;
  });
}
