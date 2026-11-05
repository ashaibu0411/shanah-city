#!/usr/bin/env node
/** List track slugs + storage mp3 from an FMA album page. */
const slug = process.argv[2] ?? "lee-wastler/come-to-jesus";
const url = `https://freemusicarchive.org/music/${slug}/`;
const html = await fetch(url, { headers: { "User-Agent": "ShanahCityStoryMusic/1.0" } }).then((r) => r.text());
const tracks = [...html.matchAll(/href="(\/music\/lee-wastler\/come-to-jesus\/[^"]+)"/gi)].map((m) => m[1]);
const unique = [...new Set(tracks)];
console.log("album", url, "tracks", unique.length);
for (const href of unique.slice(0, 20)) {
  const page = await fetch(`https://freemusicarchive.org${href}`, {
    headers: { "User-Agent": "ShanahCityStoryMusic/1.0" },
  }).then((r) => r.text());
  const title = page.match(/<title>([^<]+)/)?.[1]?.replace(/\s*-\s*Free Music Archive.*/, "").trim();
  const license = page.match(/creativecommons\.org\/licenses\/[^"'<\s]+/i)?.[0] ?? "none";
  const instrumental = page.match(/Instrumental\s*<\/[^>]+>\s*<[^>]+>\s*([^<]+)/i)?.[1]?.trim();
  const storage = page.match(/storage-freemusicarchive-org\\\/tracks\\\/[^"\\]+/)?.[0]?.replace(/\\/g, "");
  const recordingUrl = storage ? `https://files.freemusicarchive.org/${storage}` : null;
  console.log(JSON.stringify({ href, title, license, instrumental, recordingUrl }));
  await new Promise((r) => setTimeout(r, 400));
}
