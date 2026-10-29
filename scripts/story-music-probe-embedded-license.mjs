#!/usr/bin/env node
/**
 * Read Creative Commons URLs embedded in OGG/Vorbis headers (first ~128KB).
 * Commons page license can disagree with embedded tags — flag conflicts for curators.
 */

export async function fetchAudioPrefix(url, maxBytes = 128000) {
  const res = await fetch(url, {
    headers: { Range: `bytes=0-${maxBytes}`, "User-Agent": "ShanahCityStoryMusic/1.0" },
    redirect: "follow",
  });
  if (!res.ok && res.status !== 206) throw new Error(`Fetch failed HTTP ${res.status}`);
  return Buffer.from(await res.arrayBuffer());
}

export function extractEmbeddedLicenseUrls(buffer) {
  const s = buffer.toString("latin1");
  return [...new Set(s.match(/https?:\/\/creativecommons\.org\/[^\0\x01-\x1f\s]+/gi) ?? [])];
}

export function classifyEmbeddedUrls(urls) {
  const joined = urls.join(" ").toLowerCase();
  if (/by-nc|nc-/.test(joined)) return { allowed: false, reason: "NonCommercial in embedded tags" };
  if (/by-sa|sa\//.test(joined)) return { allowed: false, reason: "ShareAlike in embedded tags" };
  if (/by-nd|nd\//.test(joined)) return { allowed: false, reason: "NoDerivatives in embedded tags" };
  if (/licenses\/by\//.test(joined) || /publicdomain/.test(joined)) return { allowed: true, reason: "BY or PD in embedded tags" };
  return { allowed: urls.length === 0 ? null : true, reason: urls.length ? "Embedded CC URL present" : "No embedded CC URL" };
}

async function main() {
  const url = process.argv[2];
  if (!url) {
    console.error("Usage: node scripts/story-music-probe-embedded-license.mjs <audio-url>");
    process.exit(1);
  }
  const buf = await fetchAudioPrefix(url);
  const urls = extractEmbeddedLicenseUrls(buf);
  const verdict = classifyEmbeddedUrls(urls);
  console.log(JSON.stringify({ url, embedded: urls, verdict }, null, 2));
}

if (import.meta.url === `file://${process.argv[1]?.replace(/\\/g, "/")}` || process.argv[1]?.includes("story-music-probe-embedded-license")) {
  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
