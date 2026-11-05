/** Resolve direct HTTPS recording URL from a public FMA track page slug (e.g. lee-wastler/come-to-jesus/in-your-hands). */
export async function resolveFmaRecordingUrl(pageSlug) {
  const url = `https://freemusicarchive.org/music/${pageSlug.replace(/^\/+|\/+$/g, "")}/`;
  const res = await fetch(url, { headers: { "User-Agent": "ShanahCityStoryMusic/1.0", Accept: "text/html" } });
  if (!res.ok) {
    return { ok: false, status: res.status, url, license: null, instrumental: null, recordingUrl: null };
  }
  const html = await res.text();
  const license = html.match(/creativecommons\.org\/licenses\/[^"'<\s]+/i)?.[0] ?? null;
  const instrumental =
    html.match(/Instrumental\s*<\/[^>]+>\s*<[^>]+>\s*([^<]+)/i)?.[1]?.trim() ??
    html.match(/Instrumental[^A-Za-z]*(No|Yes)/i)?.[1] ??
    null;
  const storage = html.match(/storage-freemusicarchive-org\\\/tracks\\\/[^"\\]+/)?.[0]?.replace(/\\/g, "");
  const recordingUrl = storage ? `https://files.freemusicarchive.org/${storage}` : null;
  return { ok: true, status: res.status, url, license, instrumental, recordingUrl };
}

export function licenseAllowsStoryMusicQueue(licensePath) {
  if (!licensePath) return { allowed: false, reason: "No license on source page." };
  const lower = licensePath.toLowerCase();
  if (/by-nc|by-nd|by-sa/.test(lower)) {
    return { allowed: false, reason: `Restricted license (${lower}).` };
  }
  if (/creativecommons\.org\/licenses\/by\//.test(lower)) {
    return { allowed: true, licenseClass: "cc-by", licenseUrl: `https://${lower}` };
  }
  return { allowed: false, reason: `License not in allow-list: ${lower}` };
}
