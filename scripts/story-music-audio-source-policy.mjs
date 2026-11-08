/** Exact audio origins permitted for curator-approved Story music ingestion. */
export function resolveApprovedStoryMusicAudioUrl(raw) {
  try {
    const u = new URL(raw ?? "");
    if (u.protocol !== "https:" || u.username || u.password || u.search || u.hash) return null;
    const host = u.hostname.toLowerCase();
    const commons = host === "upload.wikimedia.org" && u.pathname.startsWith("/wikipedia/commons/");
    const archive = host === "archive.org" && u.pathname.startsWith("/download/");
    const fma = host === "files.freemusicarchive.org" &&
      u.pathname.includes("/storage-freemusicarchive-org/tracks/");
    const heartfelt = (host === "www.heartfeltmg.com" || host === "heartfeltmg.com") &&
      /^\/music\/[A-Za-z0-9%._-]+\.mp3$/i.test(u.pathname) &&
      !/%2f|%5c|\.\./i.test(u.pathname);
    return commons || archive || fma || heartfelt ? u.origin + u.pathname : null;
  } catch {
    return null;
  }
}
