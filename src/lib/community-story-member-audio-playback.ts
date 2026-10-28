/** Extract filename segment from a URL or path for MIME inference. */
export function communityAudioNameFromUrl(url: string) {
  const trimmed = url.trim();
  if (!trimmed) return "";
  try {
    if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
      const pathname = new URL(trimmed).pathname;
      const segment = pathname.split("/").pop();
      return segment ?? trimmed;
    }
  } catch {
    // fall through
  }
  const segment = trimmed.split("/").pop();
  return segment ?? trimmed;
}
