#!/usr/bin/env node
/** Probe FMA track pages for license + instrumental flag + download URL hints. */
const slug = process.argv[2] ?? "lee-wastler/come-to-jesus/in-your-hands";
const url = `https://freemusicarchive.org/music/${slug}/`;
const res = await fetch(url, { headers: { "User-Agent": "ShanahCityStoryMusic/1.0", Accept: "text/html" } });
console.log("status", res.status, url);
const html = await res.text();
const license = html.match(/creativecommons\.org\/licenses\/[^"'<\s]+/i)?.[0] ?? "none";
const instrumental = html.match(/Instrumental\s*<\/[^>]+>\s*<[^>]+>\s*([^<]+)/i)?.[1]?.trim()
  ?? html.match(/Instrumental[^A-Za-z]*([A-Za-z]+)/)?.[1];
const mp3s = [...new Set([...html.matchAll(/https:\/\/[^"'\s]+\.mp3/gi)].map((m) => m[0]))];
const storage = [...new Set([...html.matchAll(/storage-freemusicarchive[^"'\s]+/gi)].map((m) => m[0]))];
const trackFile = [...new Set([...html.matchAll(/track_file[^"'\s]+/gi)].map((m) => m[0]))];
console.log(
  JSON.stringify(
    { license, instrumental, mp3Count: mp3s.length, mp3s: mp3s.slice(0, 3), storage: storage.slice(0, 3), trackFile: trackFile.slice(0, 3) },
    null,
    2,
  ),
);
