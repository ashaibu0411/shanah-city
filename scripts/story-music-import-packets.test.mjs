import assert from "node:assert/strict";
import { FREE_LIBRARY_IMPORT_CANDIDATES, DEFAULT_IMPORT_CANDIDATE_IDS } from "./story-music-rights-packets.mjs";

async function commonsLicenseShortName(fileUrl) {
  const fileName = decodeURIComponent(fileUrl.split("/").pop() ?? "").replace(/ /g, "_");
  const title = `File:${fileName}`;
  const params = new URLSearchParams({
    action: "query",
    format: "json",
    prop: "imageinfo",
    iiprop: "extmetadata",
    titles: title,
    origin: "*",
  });
  const response = await fetch(`https://commons.wikimedia.org/w/api.php?${params}`, {
    headers: { "User-Agent": "ShanahCityStoryMusicImportTest/1.0" },
  });
  if (!response.ok) return null;
  const data = await response.json();
  const pages = data.query?.pages ?? {};
  const page = Object.values(pages)[0];
  return page?.imageinfo?.[0]?.extmetadata?.LicenseShortName?.value ?? null;
}

for (const id of DEFAULT_IMPORT_CANDIDATE_IDS) {
  const packet = FREE_LIBRARY_IMPORT_CANDIDATES[id];
  assert.ok(packet, id);
  assert.ok(packet.recordingUrl.startsWith("https://upload.wikimedia.org/"));
  assert.ok(packet.rightsEvidenceRef?.trim());
  assert.ok(packet.recordingRightsNote?.trim());
  assert.ok(packet.compositionRightsNote?.trim());
  assert.ok(packet.territory?.trim());
  assert.match(packet.recordingUrl, /\.(mp3|ogg)(\?|$)/i);
}

if (!process.env.SKIP_STORY_MUSIC_COMMONS_LIVE) {
  for (const id of DEFAULT_IMPORT_CANDIDATE_IDS) {
    const packet = FREE_LIBRARY_IMPORT_CANDIDATES[id];
    const license = await commonsLicenseShortName(packet.recordingUrl);
    assert.ok(license, `${id}: Commons license metadata missing`);
    assert.match(license, /public domain/i, `${id}: expected Public domain on Commons, got ${license}`);
  }
}

console.log("story-music-import-packets.test.mjs OK");
